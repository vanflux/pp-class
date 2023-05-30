
export interface LadInfoRow {
  nodeList: string;
  nodes: number;
  partition: string;
  state: string;
  cpus: number;
  sct: string;
  memory: number;
  tmpDisk: number;
  weight: number;
  availableFe: string;
  reason: string;
}

export function parseInfo(text: string) {
  const lines = text.split('\n').map(line => line.trim());
  const headerIndex = lines.findIndex(line => line.includes('NODELIST'));
  const headerLine = lines[headerIndex];
  let nodeListStartI = 0 , nodeListEndI = 0,
      nodesStartI = 0 , nodesEndI = 0,
      partitionStartI = 0 , partitionEndI = 0,
      stateStartI = 0 , stateEndI = 0,
      cpusStartI = 0 , cpusEndI = 0,
      sctStartI = 0 , sctEndI = 0,
      memoryStartI = 0 , memoryEndI = 0,
      tmpDiskStartI = 0 , tmpDiskEndI = 0,
      weightStartI = 0 , weightEndI = 0,
      availableStartI = 0 , availableEndI = 0,
      reasonStartI = 0;
  let lastI = 0;
  const isEmpty = (c: string) => c === ' ' || c === '\t';
  for (let i = 1; i <= headerLine.length; i++) {
    if ((isEmpty(headerLine[i - 1]) && !isEmpty(headerLine[i])) || i === headerLine.length) {
      const rawName = headerLine.substring(lastI, i).trim().toUpperCase();
      switch (rawName) {
        case 'NODELIST':
          nodeListStartI = lastI;
          nodeListEndI = i;
          break;
        case 'NODES':
          nodesStartI = lastI;
          nodesEndI = i;
          break;
        case 'PARTITION':
          partitionStartI = lastI;
          partitionEndI = i;
          break;
        case 'STATE':
          stateStartI = lastI;
          stateEndI = i;
          break;
        case 'CPUS':
          cpusStartI = lastI;
          cpusEndI = i;
          break;
        case 'S:C:T':
          sctStartI = lastI;
          sctEndI = i;
          break;
        case 'MEMORY':
          memoryStartI = lastI;
          memoryEndI = i;
          break;
        case 'TMP_DISK':
          tmpDiskStartI = lastI;
          tmpDiskEndI = i;
          break;
        case 'WEIGHT':
          weightStartI = lastI;
          weightEndI = i;
          break;
        case 'AVAIL_FE':
          availableStartI = lastI;
          availableEndI = i;
          break;
        case 'REASON':
          reasonStartI = lastI;
          break;
      }
      lastI = i;
    }
  }
  const rows: LadInfoRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const row: LadInfoRow = {
      nodeList: line.substring(nodeListStartI, nodeListEndI).trim(),
      nodes: parseInt(line.substring(nodesStartI, nodesEndI).trim()),
      partition: line.substring(partitionStartI, partitionEndI).trim(),
      state: line.substring(stateStartI, stateEndI).trim(),
      cpus: parseInt(line.substring(cpusStartI, cpusEndI).trim()),
      sct: line.substring(sctStartI, sctEndI).trim(),
      memory: parseInt(line.substring(memoryStartI, memoryEndI).trim()),
      tmpDisk: parseInt(line.substring(tmpDiskStartI, tmpDiskEndI).trim()),
      weight: parseInt(line.substring(weightStartI, weightEndI).trim()),
      availableFe: line.substring(availableStartI, availableEndI).trim(),
      reason: line.substring(reasonStartI).trim(),
    };
    rows.push(row);
  }
  return rows;
}
