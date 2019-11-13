export const cleanName = (originalNs: string, safeNs: string, name: string) => {
  let output = name;

  if (safeNs.startsWith('oslc')) {
    const ns = safeNs.slice(4);

    output = 'OSLC' + ns + name;
  } else if (originalNs === 'sgo') {
    output = name;
  } else {
    output = safeNs + name;
  }

  return output.replace(/\//g, '');
};

export const getName = (value: string) => {
  const split = value.split('/');

  if (split.length === 2) {
    return { ns: '', name: split[1] };
  } else if (split.length === 4) {
    return {
      name: split[split.length - 1],
      ns: split[split.length - 3] + '/' + split[split.length - 2],
    };
  }

  return { ns: split[split.length - 2], name: split[split.length - 1] };
};

export const flipRelationshipName = (value: string) => {
  if (value.endsWith('s')) {
    if (value === 'belongs') {
      return 'owns';
    }

    return value.charAt(value.length - 2) === 'e'
      ? value.substr(0, value.length - 2) + 'edBy'
      : value.substr(0, value.length - 1) + 'edBy';
  } else if (value.endsWith('To')) {
    return value + 'By';
  } else if (value === 'runsOn') {
    return 'runnable';
  } else if (value.endsWith('With')) {
    return value.substr(0, value.length - 4) + 'From';
  } else if (value === 'derivesFrom') {
    return 'deriving';
  } else if (value === 'dependsOn') {
    return 'dependant';
  }

  return value;
};

export const generateOutputs = (output: IOutput) => {
  let imports = '';
  let exports = '';
  let singleExports = '';
  const names: Array<{ name: string; fileName: string }> = [];
  const keys = Object.keys(output).sort((a, b) => {
    if (a === b) {
      return 0;
    }

    if (a > b) {
      return 1;
    }

    return -1;
  });

  keys.map((key, i) => {
    const value = output[key];
    const safeName = value.name.replace(/-|\//g, '');
    const fileName = key
      .toLowerCase()
      .replace('ogit/', '')
      .replace(/\//g, '-');

    imports += `const ${safeName} = require("./${fileName}");\n`;
    exports += `    ${safeName}.default${i === keys.length - 1 ? '' : ',\n'}`;
    singleExports += `exports.${safeName} = ${safeName}.default;`;
    names.push({ name: safeName, fileName });
  });

  return { imports, exports, singleExports, names };
};

const replaceAll = (o?: IDefinitionData, value = 'string') =>
  !o ? o : Object.assign({}, ...Object.keys(o).map((k) => ({ [k]: value })));

export const getDefinitionTypings = (o?: IDefinitionData) =>
  !o ? '' : JSON.stringify(replaceAll(o)).replace(/"/g, '');

export function toTypes() {
  return (text: string) => {
    // @ts-ignore
    const value = this[text];

    if (!value || !text) {
      return '';
    }

    return text + ': ' + getDefinitionTypings(value as IDefinitionData);
  };
}

export function toProp() {
  return (text: string) => {
    // @ts-ignore
    const value = this[text] as object;

    if (!value || !text) {
      return '';
    }

    return Object.keys(value)
      .filter((k) => k !== 'type')
      .map((k) => `${k}${text !== 'required' ? '?' : ''}:any;`)
      .join('\n');
  };
}
