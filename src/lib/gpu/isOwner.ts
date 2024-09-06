import { logger } from 'shared/logger';

import {
  GPUExecution,
  IShaderCode,
  IGPUInput,
  IGPUResult,
  IEntryInfo,
  multipassEntryCreatorReuseBuffers
} from './helpers/multipassEntryCreator';
import { addNeededBuffers } from './helpers/utils';
import { workgroupSize } from './params';
import { poseidon_multipass_info } from './poseidon';
import { CurveWGSL } from './shaders/curve';
import { FieldAddWGSL } from './shaders/fieldAdd';
import { FieldDoubleWGSL } from './shaders/fieldDouble';
import { FieldInverseWGSL } from './shaders/fieldInverse';
import { FieldModulusWGSL } from './shaders/fieldModulus';
import { FieldSubWGSL } from './shaders/fieldSub';
import { PoseidonConstantsWGSL } from './shaders/poseidonAleoConstants';

export const is_owner_multi = async (
  cipherTextAffineCoords: Array<number>,
  encryptedOwnerXs: Array<number>,
  aleoMds: Array<number>,
  aleoRoundConstants: Array<number>,
  scalar: Array<number>,
  address_x: Array<number>
) => {
  const gpu = await getDevice();

  const embededConstantsWGSL = `
  const EMBEDDED_SCALAR: fw = fw(array<u32,8>(${scalar[0]},${scalar[1]},${scalar[2]},${scalar[3]},${scalar[4]},${scalar[5]},${scalar[6]},${scalar[7]}));const EMBEDDED_ADDRESS_X: fw = fw(array<u32,8>(${address_x[0]},${address_x[1]},${address_x[2]},${address_x[3]},${address_x[4]},${address_x[5]},${address_x[6]},${address_x[7]}));
  `;

  // Maps size to buffers of that size. Needed to reuse buffers.
  // Total buffer size needed per input is 1280 bytes.
  const buffersMap = new Map<number, GPUBuffer[]>();

  const baseModules = [
    PoseidonConstantsWGSL,
    FieldModulusWGSL,
    FieldAddWGSL,
    FieldSubWGSL,
    FieldDoubleWGSL,
    FieldInverseWGSL,
    CurveWGSL,
    embededConstantsWGSL
  ];
  const numInputs = cipherTextAffineCoords.length / 16;
  const fieldArraySize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8;

  const postHashEntry = `
  @group(0)@binding(0)var<storage,read_write> eu: array<fw>;@group(0)@binding(1)var<storage,read_write> bx: array<fw>;@group(0)@binding(2)var<storage,read_write> ao: ay;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var cm = eu[ar.x];var at = bv(bx[ar.x],cm);ao.bh[ar.x] = bv(at,EMBEDDED_ADDRESS_X);}
  `;

  let executionSteps: GPUExecution[] = [];
  const pointScalarPasses = point_mul_multipass(
    gpu,
    numInputs,
    cipherTextAffineCoords,
    [embededConstantsWGSL],
    buffersMap
  );
  executionSteps = executionSteps.concat(pointScalarPasses[0]);

  // Add poseidon rounds
  const poseidonRounds = poseidon_multipass_info(
    gpu,
    numInputs,
    new Array<number>(),
    aleoMds,
    aleoRoundConstants,
    buffersMap,
    false
  );
  executionSteps = executionSteps.concat(poseidonRounds[0]);

  // Add post hash entry
  const postHashShader: IShaderCode = {
    code: [...baseModules, postHashEntry].join('\n'),
    entryPoint: 'ax'
  };
  addNeededBuffers(gpu, fieldArraySize, 4, buffersMap);

  const postHashInputs: IGPUInput = {
    inputBuffers: [buffersMap.get(fieldArraySize)![0], buffersMap.get(fieldArraySize)![2]],
    mappedInputs: new Map<number, Uint32Array>([[1, new Uint32Array(encryptedOwnerXs)]])
  };
  const postHashResultInfo: IGPUResult = {
    resultBuffers: [buffersMap.get(fieldArraySize)![3]]
  };
  const postHashExecution = new GPUExecution(postHashShader, postHashInputs, postHashResultInfo);
  executionSteps.push(postHashExecution);

  const entryInfo: IEntryInfo = {
    numInputs: numInputs,
    outputSize: fieldArraySize
  };

  const res = await multipassEntryCreatorReuseBuffers(gpu, executionSteps, entryInfo);
  for (const buffers of buffersMap.values()) {
    for (const b of buffers) {
      b.destroy();
    }
  }

  return res;
};

const point_mul_multipass = (
  gpu: GPUDevice,
  numInputs: number,
  affinePoints: Array<number>,
  extraBaseShaders: string[],
  buffersToReuse: Map<number, GPUBuffer[]>
): [GPUExecution[], IEntryInfo] => {
  let baseModules = [FieldModulusWGSL, FieldAddWGSL, FieldSubWGSL, FieldDoubleWGSL, FieldInverseWGSL, CurveWGSL];
  baseModules = baseModules.concat(extraBaseShaders);

  const affinePointsBufferSize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8 * 2; // 2 fields per affine point
  const scalarsBufferSize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8;
  const pointsBufferSize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8 * 4; // 4 fields per point

  // Create all of the buffers needed for the passes
  addNeededBuffers(gpu, affinePointsBufferSize, 1, buffersToReuse);
  addNeededBuffers(gpu, pointsBufferSize, 4, buffersToReuse);
  addNeededBuffers(gpu, scalarsBufferSize, 2, buffersToReuse);

  const calcExtendedPointsEntry = `
  @group(0)@binding(0)var<storage,read_write> eu: array<cj>;@group(0)@binding(1)var<storage,read_write> ao: array<by>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var am = eu[ar.x];var ef = el(am.x,am.y);var z = cd;var cb = by(am.x,am.y,ef,z);ao[ar.x] = cb;}
  `;

  const mulPointFirstStepEntry = `
  @group(0)@binding(0)var<storage,read_write> dw: array<by>;@group(0)@binding(1)var<storage,read_write> ao: array<by>;@group(0)@binding(2)var<storage,read_write> af: ay;@group(0)@binding(3)var<storage,read_write> fh: array<by>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var eb = dw[ar.x];var dm = fe(eb,EMBEDDED_SCALAR);ao[ar.x] = dm.ap;af.bh[ar.x] = dm.cv;fh[ar.x] = dm.em;}
  `;

  const mulPointIntermediateStepEntry = `
  @group(0)@binding(0)var<storage,read_write> dw: array<by>;@group(0)@binding(1)var<storage,read_write> fv: ay;@group(0)@binding(2)var<storage,read_write> fs: array<by>;@group(0)@binding(3)var<storage,read_write> ao: array<by>;@group(0)@binding(4)var<storage,read_write> af: ay;@group(0)@binding(5)var<storage,read_write> fh: array<by>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var eb = dw[ar.x];var cv = fv.bh[ar.x];var em = fs[ar.x];var gd = ge(eb,cv,em);ao[ar.x] = gd.ap;af.bh[ar.x] = gd.cv;fh[ar.x] = gd.em;}
  `;

  const mulPointFinalStepEntry = `
  @group(0)@binding(0)var<storage,read_write> dw: array<by>;@group(0)@binding(1)var<storage,read_write> fv: ay;@group(0)@binding(2)var<storage,read_write> fs: array<by>;@group(0)@binding(3)var<storage,read_write> ao: array<by>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var eb = dw[ar.x];var cv = fv.bh[ar.x];var em = fs[ar.x];var dm = ge(eb,cv,em);ao[ar.x] = dm.ap;}
  `;

  const inverseStepEntry = `
  @group(0)@binding(0)var<storage,read_write> aa: array<by>;@group(0)@binding(1)var<storage,read_write> ao: ay;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var eb = aa[ar.x];var ej = bj(eb.z);var ap = el(eb.x,ej);ao.bh[ar.x] = ap;}
  `;

  const executionSteps: GPUExecution[] = [];

  // Step 1: Calculate extended points
  const calcExtendedPointsShader: IShaderCode = {
    code: [...baseModules, calcExtendedPointsEntry].join('\n'),
    entryPoint: 'ax'
  };
  const calcExtendedPointsInputs: IGPUInput = {
    inputBuffers: [buffersToReuse.get(affinePointsBufferSize)![0]],
    mappedInputs: new Map<number, Uint32Array>([[0, new Uint32Array(affinePoints)]])
  };
  const calcExtendedPointsResult: IGPUResult = {
    resultBuffers: [buffersToReuse.get(pointsBufferSize)![0]]
  };
  const calcExtendedPointsStep = new GPUExecution(
    calcExtendedPointsShader,
    calcExtendedPointsInputs,
    calcExtendedPointsResult
  );
  executionSteps.push(calcExtendedPointsStep);

  // Step 2: Multiply points by scalars
  const firstMulPointShader: IShaderCode = {
    code: [...baseModules, mulPointFirstStepEntry].join('\n'),
    entryPoint: 'ax'
  };
  const firstMulPointInputs: IGPUInput = {
    inputBuffers: [buffersToReuse.get(pointsBufferSize)![0]]
  };
  const firstMulPointOutputs: IGPUResult = {
    resultBuffers: [
      buffersToReuse.get(pointsBufferSize)![1],
      buffersToReuse.get(scalarsBufferSize)![0],
      buffersToReuse.get(pointsBufferSize)![2]
    ]
  };
  const firstMulPointStep = new GPUExecution(firstMulPointShader, firstMulPointInputs, firstMulPointOutputs);
  executionSteps.push(firstMulPointStep);

  // Add the intermediate steps of the execution
  const multPointShader: IShaderCode = {
    code: [...baseModules, mulPointIntermediateStepEntry].join('\n'),
    entryPoint: 'ax'
  };
  // intermediate step 1
  const mulPointInputs1: IGPUInput = {
    inputBuffers: [
      buffersToReuse.get(pointsBufferSize)![1],
      buffersToReuse.get(scalarsBufferSize)![0],
      buffersToReuse.get(pointsBufferSize)![2]
    ]
  };
  const mulPointResult1: IGPUResult = {
    resultBuffers: [
      buffersToReuse.get(pointsBufferSize)![0],
      buffersToReuse.get(scalarsBufferSize)![1],
      buffersToReuse.get(pointsBufferSize)![3]
    ]
  };
  const mulPointStep1 = new GPUExecution(multPointShader, mulPointInputs1, mulPointResult1);
  executionSteps.push(mulPointStep1);

  // intermediate step 2
  const mulPointInputs2: IGPUInput = {
    inputBuffers: [
      buffersToReuse.get(pointsBufferSize)![0],
      buffersToReuse.get(scalarsBufferSize)![1],
      buffersToReuse.get(pointsBufferSize)![3]
    ]
  };
  const mulPointResult2: IGPUResult = {
    resultBuffers: [
      buffersToReuse.get(pointsBufferSize)![1],
      buffersToReuse.get(scalarsBufferSize)![0],
      buffersToReuse.get(pointsBufferSize)![2]
    ]
  };
  const mulPointStep2 = new GPUExecution(multPointShader, mulPointInputs2, mulPointResult2);
  executionSteps.push(mulPointStep2);

  const finalMultPointShader: IShaderCode = {
    code: [...baseModules, mulPointFinalStepEntry].join('\n'),
    entryPoint: 'ax'
  };
  const finalMulPointInputs: IGPUInput = {
    inputBuffers: [
      buffersToReuse.get(pointsBufferSize)![1],
      buffersToReuse.get(scalarsBufferSize)![0],
      buffersToReuse.get(pointsBufferSize)![2]
    ]
  };
  const finalMulPointResult: IGPUResult = {
    resultBuffers: [buffersToReuse.get(pointsBufferSize)![0]]
  };
  const finalMulPointStep = new GPUExecution(finalMultPointShader, finalMulPointInputs, finalMulPointResult);
  executionSteps.push(finalMulPointStep);

  // Step 3: Inverse and multiply points
  const inverseShader: IShaderCode = {
    code: [...baseModules, inverseStepEntry].join('\n'),
    entryPoint: 'ax'
  };
  const inverseInputs: IGPUInput = {
    inputBuffers: [buffersToReuse.get(pointsBufferSize)![0]]
  };
  const inverseResult: IGPUResult = {
    resultBuffers: [buffersToReuse.get(scalarsBufferSize)![0]]
  };
  const inverseStep = new GPUExecution(inverseShader, inverseInputs, inverseResult);
  executionSteps.push(inverseStep);

  const entryInfo: IEntryInfo = {
    numInputs: numInputs,
    outputSize: scalarsBufferSize
  };

  return [executionSteps, entryInfo];
};

const getDevice = async () => {
  if (!('gpu' in navigator)) {
    console.log('WebGPU is not supported on this device');
    throw new Error('WebGPU is not supported on this device');
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) {
    console.log('Adapter not found');
    throw new Error('Adapter not found');
  }
  const gpu = await adapter.requestDevice();

  gpu.lost.then(info => {
    logger.error('GPU lost', info);
  });

  return gpu;
};
