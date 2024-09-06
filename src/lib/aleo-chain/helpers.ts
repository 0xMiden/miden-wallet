export function extractProgramName(input: string): string | undefined {
  const programDeclarationPattern = /program\s+([\w\d_]+\.aleo);/;

  const match = input.match(programDeclarationPattern);
  if (match && match[1]) {
    return match[1];
  }
  return undefined;
}

interface InputOutput {
  type: string;
  visibility: string;
  index: number;
}

interface FunctionData {
  inputs: InputOutput[];
  outputs: InputOutput[];
}

interface RecordComponent {
  name: string;
  visibility: string;
  type: string;
}

interface RecordData {
  components: RecordComponent[];
}

export interface AleoProgram {
  id: string;
  functions: Record<string, FunctionData>;
  records: Record<string, RecordData>;
}

export type ProgramMap = { [key: string]: AleoProgram };

/**
 * TODO Regexes for getting mapping parts
 * TODO Regexes for getting struct parts
 * TODO Regexes for getting finalize parts
 * Not needed for right now ^
 *
 * @param program Parses an aleo program string into a ts usable object
 * @returns AleoProgram
 */
export function parseAleoProgram(program: string): AleoProgram {
  const programParts = getProgramParts(program);

  // Get parsed function from program parts
  const inputOutputRegex = /^(input|output) (r\d+) as ([\w.]+);/;
  const inputOutputExternalRegex = /^(input|output) (r\d+) as (([\w.]+)(?:\.aleo\/)?([\w.]+)(?:\.([\w.]+))?);/;
  const functions: Record<string, FunctionData> = {};
  const functionsToParse = programParts.get('function');
  if (functionsToParse) {
    for (let functionName in functionsToParse) {
      functions[functionName] = { inputs: [], outputs: [] };
      const functionParts = functionsToParse[functionName];
      for (let line of functionParts) {
        let inputOutputMatch = line.match(inputOutputRegex);
        if (inputOutputMatch) {
          const ioType = inputOutputMatch[1];
          const typeAndVisibility = inputOutputMatch[3].split('.');
          const type = typeAndVisibility[0];
          const visibility = typeAndVisibility[1];

          let ioData: InputOutput = { type, visibility, index: 0 };

          if (ioType === 'input') {
            ioData.index = functions[functionName].inputs.length;
            functions[functionName].inputs.push(ioData);
          } else {
            ioData.index = functions[functionName].outputs.length;
            functions[functionName].outputs.push(ioData);
          }
        } else {
          inputOutputMatch = line.match(inputOutputExternalRegex);
          if (inputOutputMatch) {
            const ioType = inputOutputMatch[1];
            const typeAndVisibility = inputOutputMatch[5].split('.');
            const type = typeAndVisibility[0];
            const visibility = typeAndVisibility[1] === 'record' ? 'external_record' : typeAndVisibility[1];
            let ioData: InputOutput = { type, visibility, index: 0 };

            if (ioType === 'input') {
              ioData.index = functions[functionName].inputs.length;
              functions[functionName].inputs.push(ioData);
            } else {
              ioData.index = functions[functionName].outputs.length;
              functions[functionName].outputs.push(ioData);
            }
          }
        }
      }
    }
  }

  // Get parsed records from program parts
  const componentRegex = /(\w+) as (\w+).(\w+);/;
  const records: Record<string, RecordData> = {};
  const recordsToParse = programParts.get('record');
  if (recordsToParse) {
    for (let recordName in recordsToParse) {
      records[recordName] = { components: [] };
      const recordParts = recordsToParse[recordName];
      for (let line of recordParts) {
        const componentMatch = line.match(componentRegex);
        if (!componentMatch) {
          continue;
        }
        const [, name, type, visibility] = componentMatch;
        records[recordName].components.push({ name, visibility, type });
      }
    }
  }

  // TODO IMPROVEMENT
  // add custom parsing for mappings, finalize, and structs to extract needed parts.
  // (They are currently just strings in programParts)
  // Update AleoProgram interface to support these

  const id = extractProgramName(program) || '';
  return { id, functions, records };
}

/**
 * Parses a program into it's declared pieces (ie functions, records, structs, etc). For example, cookie_monster would return:
 * Map(3) {
      'struct' => {
        CookieStats: [ 'cookie_type as u64;', 'cookie_deliciousness as u32;' ]
      },
      'record' => {
        cookie: [
          'owner as address.private;',
          'microcredits as u64.private;',
          'cookie_info as CookieStats.private;'
        ],
        cookie_bad: [
          'owner as address.private;',
          'microcredits as u64.private;',
          'cookie_info as CookieStats.private;'
        ]
      },
      'function' => {
        bake_cookie: [
          'input r0 as address.private;',
          'input r1 as u64.private;',
          'input r2 as u32.public;',
          'cast r1 r2 into r3 as CookieStats;',
          'cast r0 0u64 r3 into r4 as cookie.record;',
          'cast r0 0u64 r3 into r5 as cookie_bad.record;',
          'output r4 as cookie.record;',
          'output r5 as cookie_bad.record;'
        ],
        eat_cookie: [
          'input r0 as cookie.record;',
          'cast r0 0u64 0 into r1 as cookie_bad.record;',
          'output r1 as cookie_bad.external_record;'
        ]
      }
    }
 * Expected unique parsing for each type will occur after this function
 * @param program aleo program string
 * @returns 
 */
function getProgramParts(program: string): Map<string, Record<string, string[]>> {
  const declarationRegex = /^(\w+) (\w+):$/;

  // Generate a map of declared types (ie, mapping, struct, record, function) to records of that type
  const updatesToBeMade: Map<string, Record<string, string[]>> = new Map();
  let currentDeclaredType;
  let currentTypeName;
  let linesAssociatedWithTheDeclaration: Record<string, string[]> = {};
  const lines = program.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line === '') {
      continue;
    }

    const declarationMatch = line.match(declarationRegex);

    if (declarationMatch) {
      const declarationType = declarationMatch[1];
      const typeName = declarationMatch[2];
      const typeChanged = declarationType !== currentDeclaredType;

      // If we have a change in declaration, flush the current one we've been building up
      if (typeChanged && currentDeclaredType) {
        const currentUpdatesForType = updatesToBeMade.get(currentDeclaredType);
        updatesToBeMade.set(currentDeclaredType, { ...currentUpdatesForType, ...linesAssociatedWithTheDeclaration });
        linesAssociatedWithTheDeclaration = {};
      }
      currentDeclaredType = declarationType;
      currentTypeName = typeName;
    } else if (currentTypeName && currentDeclaredType) {
      if (linesAssociatedWithTheDeclaration[currentTypeName]) {
        linesAssociatedWithTheDeclaration[currentTypeName].push(line);
      } else {
        linesAssociatedWithTheDeclaration[currentTypeName] = [line];
      }
    }
  }
  // Flush the last one
  if (currentDeclaredType) {
    const currentUpdatesForType = updatesToBeMade.get(currentDeclaredType);
    updatesToBeMade.set(currentDeclaredType, { ...currentUpdatesForType, ...linesAssociatedWithTheDeclaration });
  }

  return updatesToBeMade;
}

export function extractMicrocredits(record: string): bigint {
  const microcreditsRegex = /microcredits:\s*([\d]+)u64\.private/;
  const match = record.match(microcreditsRegex);
  return match ? BigInt(match[1]) : BigInt(0);
}

export const shrinkAddressStrings = (input: string): string => {
  const pattern = /(aleo1.{2}).*(.{5})/g;
  return input.replace(pattern, '$1...$2');
};

export const replaceAleoAddressesWithAlias = (input: string, aliases: Map<string, string>): string => {
  const pattern = /(aleo1.{58})/g;
  return input.replace(pattern, (_, address) => {
    const alias = aliases.get(address);
    return alias ? alias : address;
  });
};

export const parseTokenBalanceJson = (balanceJson: string): bigint => {
  try {
    const balanceData = parseTokenJsonString(balanceJson);
    return parseTokenBalance(balanceData.balance);
  } catch (e: any) {
    return BigInt(0);
  }
};

export const parseTokenBalance = (balanceString: string): bigint => BigInt(balanceString.slice(0, -4));

// removes new lines, enforces double quotes around keys and values
export const parseTokenJsonString = (tokenString: string) => {
  try {
    const cleanedString = tokenString.replace(/(\w+):\s*([^,\n]+)(,|\n|$)/g, '"$1": "$2"$3');
    return JSON.parse(cleanedString);
  } catch (e: any) {
    return {};
  }
};
