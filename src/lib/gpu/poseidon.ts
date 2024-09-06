import { GPUExecution, IShaderCode, IGPUInput, IGPUResult, IEntryInfo } from './helpers/multipassEntryCreator';
import { addNeededBuffers } from './helpers/utils';
import { workgroupSize } from './params';
import { FieldAddWGSL } from './shaders/fieldAdd';
import { FieldModulusWGSL } from './shaders/fieldModulus';
import { PoseidonFirstHashOutputWGSL, PoseidonRoundFullWGSL, PoseidonRoundPartialWGSL } from './shaders/fieldPoseidon';
import { PoseidonConstantsWGSL } from './shaders/poseidonAleoConstants';

export const poseidon_multipass_info = (
  gpu: GPUDevice,
  numInputs: number,
  input1: Array<number>,
  aleoMds: Array<number>,
  aleoRoundConstants: Array<number>,
  buffersToReuse: Map<number, GPUBuffer[]>,
  useInputs = true
): [GPUExecution[], IEntryInfo] => {
  const baseModules = [PoseidonConstantsWGSL, FieldModulusWGSL, FieldAddWGSL];
  const fieldsBufferSize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8;
  const arrayBufferSize = Uint32Array.BYTES_PER_ELEMENT * numInputs * 8 * 9; // Because 9 fields per array
  const aleoMdsBufferSize = Uint32Array.BYTES_PER_ELEMENT * 9 * 8 * 9;
  const aleoRoundConstantsBufferSize = Uint32Array.BYTES_PER_ELEMENT * 39 * 8 * 9;

  addNeededBuffers(gpu, fieldsBufferSize, 1, buffersToReuse);
  addNeededBuffers(gpu, arrayBufferSize, 2, buffersToReuse);
  addNeededBuffers(gpu, aleoMdsBufferSize, 1, buffersToReuse);
  addNeededBuffers(gpu, aleoRoundConstantsBufferSize, 1, buffersToReuse);

  const firstHashEntry = `
  @group(0)@binding(0)var<storage,read_write> eu: cw;@group(0)@binding(1)var<storage,read_write> ao: array<array<fw,9>>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var ap = dt(eu.cw[ar.x]);ao[ar.x] = ap;}
  `;

  const fullRoundEntry = (roundOffset: number) => `
  @group(0)@binding(0)var<storage,read_write> eu: array<array<fw,9>>;@group(0)@binding(1)var<storage,read_write> fq: array<array<bn,9>,9>;@group(0)@binding(2)var<storage,read_write> ga: array<array<bn,9>,39>;@group(0)@binding(3)var<storage,read_write> ao: array<array<fw,9>>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var ap = ec(eu[ar.x],${roundOffset}u);ao[ar.x] = ap;}
  `;

  const partialRoundEntry = (roundOffset: number) => `
  @group(0)@binding(0)var<storage,read_write> eu: array<array<fw,9>>;@group(0)@binding(1)var<storage,read_write> fq: array<array<bn,9>,9>;@group(0)@binding(2)var<storage,read_write> ga: array<array<bn,9>,39>;@group(0)@binding(3)var<storage,read_write> ao: array<array<fw,9>>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var ap = ce(eu[ar.x],${roundOffset}u);ao[ar.x] = ap;}
  `;

  const finalEntry = `
  @group(0)@binding(0)var<storage,read_write> eu: array<array<fw,9>>;@group(0)@binding(1)var<storage,read_write> ao: array<bn>;@compute @workgroup_size(${workgroupSize})fn ax(@builtin(global_invocation_id)ar : vec3<u32>){var ap = eu[ar.x][1];ao[ar.x] = ap;}
  `;

  const executionSteps: GPUExecution[] = [];

  // Add first hash step
  const firstHashShader: IShaderCode = {
    code: [...baseModules, PoseidonFirstHashOutputWGSL, firstHashEntry].join('\n'),
    entryPoint: 'ax'
  };
  const firstHashInputs: IGPUInput = {
    inputBuffers: [buffersToReuse.get(fieldsBufferSize)![0]],
    mappedInputs: useInputs ? new Map<number, Uint32Array>([[0, new Uint32Array(input1)]]) : undefined
  };
  const firstHashResult: IGPUResult = {
    resultBuffers: [buffersToReuse.get(arrayBufferSize)![0]]
  };
  const firstHashExecution = new GPUExecution(firstHashShader, firstHashInputs, firstHashResult);
  executionSteps.push(firstHashExecution);

  // Add first 4 full round executions
  for (let i = 0; i < 4; i++) {
    const fullRoundShader: IShaderCode = {
      code: [...baseModules, PoseidonRoundFullWGSL, fullRoundEntry(i)].join('\n'),
      entryPoint: 'ax'
    };
    const fullRoundInputs: IGPUInput = {
      inputBuffers: [
        i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![0] : buffersToReuse.get(arrayBufferSize)![1],
        buffersToReuse.get(aleoMdsBufferSize)![0],
        buffersToReuse.get(aleoRoundConstantsBufferSize)![0]
      ],
      mappedInputs:
        i === 0
          ? new Map<number, Uint32Array>([
              [1, new Uint32Array(aleoMds)],
              [2, new Uint32Array(aleoRoundConstants)]
            ])
          : undefined
    };
    const fullRoundResult: IGPUResult = {
      resultBuffers: [i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![1] : buffersToReuse.get(arrayBufferSize)![0]]
    };
    const fullRoundExecution = new GPUExecution(fullRoundShader, fullRoundInputs, fullRoundResult);
    executionSteps.push(fullRoundExecution);
  }

  // Add the 31 partial round executions
  for (let i = 0; i < 31; i++) {
    const partialRoundShader: IShaderCode = {
      code: [...baseModules, PoseidonRoundPartialWGSL, partialRoundEntry(i + 4)].join('\n'),
      entryPoint: 'ax'
    };
    const partialRoundInputs: IGPUInput = {
      inputBuffers: [
        i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![0] : buffersToReuse.get(arrayBufferSize)![1],
        buffersToReuse.get(aleoMdsBufferSize)![0],
        buffersToReuse.get(aleoRoundConstantsBufferSize)![0]
      ]
      // mappedInputs: new Map<number, Uint32Array>([[1, new Uint32Array(aleoMds)], [2, new Uint32Array(aleoRoundConstants)]])
    };
    const partialRoundResult: IGPUResult = {
      resultBuffers: [i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![1] : buffersToReuse.get(arrayBufferSize)![0]]
    };
    const partialRoundExecution = new GPUExecution(partialRoundShader, partialRoundInputs, partialRoundResult);
    executionSteps.push(partialRoundExecution);
  }

  // Add final 4 full round executions
  for (let i = 0; i < 4; i++) {
    const fullRoundShader: IShaderCode = {
      code: [...baseModules, PoseidonRoundFullWGSL, fullRoundEntry(i + 35)].join('\n'),
      entryPoint: 'ax'
    };
    const fullRoundInputs: IGPUInput = {
      inputBuffers: [
        i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![1] : buffersToReuse.get(arrayBufferSize)![0],
        buffersToReuse.get(aleoMdsBufferSize)![0],
        buffersToReuse.get(aleoRoundConstantsBufferSize)![0]
      ]
      // mappedInputs: new Map<number, Uint32Array>([[1, new Uint32Array(aleoMds)], [2, new Uint32Array(aleoRoundConstants)]])
    };
    const fullRoundResult: IGPUResult = {
      resultBuffers: [i % 2 === 0 ? buffersToReuse.get(arrayBufferSize)![0] : buffersToReuse.get(arrayBufferSize)![1]]
    };
    const fullRoundExecution = new GPUExecution(fullRoundShader, fullRoundInputs, fullRoundResult);
    executionSteps.push(fullRoundExecution);
  }

  // Add final step
  const finalShader: IShaderCode = {
    code: [FieldModulusWGSL, finalEntry].join('\n'),
    entryPoint: 'ax'
  };
  const finalInputs: IGPUInput = {
    inputBuffers: [buffersToReuse.get(arrayBufferSize)![1]]
  };
  const finalResult: IGPUResult = {
    resultBuffers: [buffersToReuse.get(fieldsBufferSize)![0]]
  };
  const finalExecution = new GPUExecution(finalShader, finalInputs, finalResult);
  executionSteps.push(finalExecution);

  const entryInfo: IEntryInfo = {
    numInputs: numInputs,
    outputSize: fieldsBufferSize
  };

  return [executionSteps, entryInfo];
};
