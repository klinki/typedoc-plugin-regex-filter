import {
  Application,
  Context,
  Converter,
  Reflection,
  ReflectionFlag,
  DeclarationReflection,
  ParameterType,
} from "typedoc";

export type FilterScope = 'method'|'field'|'function'|'class'|'all';

export interface Configuration {
  regex: string;
  scope: FilterScope[];
  markAsPrivate: boolean;
  exclude: boolean;
  logMatches: boolean;
}

export type RuntimeConfiguration = Configuration & { regexObject: RegExp, scopeAll: boolean };

function setupConfigDeclarations(app: Readonly<Application>) {
  app.options.addDeclaration({
    name: "removeRegex",
    help: "Regular expression used to match reflection names. Default ^_(.*)",
    type: ParameterType.String,
    defaultValue: "^_(.*)",
  });
  // app.options.addDeclaration({
  //   name: "removeRegexScope",
  //   help: "Filtering scope, default 'all'",
  //   type: ParameterType.Array,
  //   defaultValue: ['all'],
  // });
  app.options.addDeclaration({
    name: "removeRegexMarkAsPrivate",
    help: "Mark matching reflections as private",
    type: ParameterType.Boolean,
    defaultValue: true,
  });
  app.options.addDeclaration({
    name: "removeRegexExclude",
    help: "Exclude matching reflections. Mutually exclusive with --markAsPrivate",
    type: ParameterType.Boolean,
    defaultValue: false,
  });
  app.options.addDeclaration({
    name: "removeRegexLogMatches",
    help: "Log matches",
    type: ParameterType.Boolean,
    defaultValue: false,
  });
}

let configuration: RuntimeConfiguration|null = null;

function loadConfiguration(app: Readonly<Application>): RuntimeConfiguration {
  if (configuration !== null) {
    return configuration;
  }

  const regexStr = app.options.getValue('removeRegex') as string;
  const regex = new RegExp(regexStr);
  const scope = ['all'];
  const scopeAll = scope.includes('all');

  configuration = {
    regex: regexStr,
    regexObject: regex,
    scopeAll: scopeAll,
    scope: ['all'], // app.options.getValue('removeRegexScope') as FilterScope[],
    exclude: app.options.getValue('removeRegexExclude') as boolean,
    markAsPrivate: app.options.getValue('removeRegexMarkAsPrivate') as boolean,
    logMatches: app.options.getValue('removeRegexLogMatches') as boolean,
  };

  return configuration;
}

export function load(app: Readonly<Application>) {
  setupConfigDeclarations(app);

  const exclusionArray: Reflection[] = [];

  const onRegexMatch = (config: Configuration, reflection: Reflection) => {
    if (config.logMatches) {
      const operation = config.exclude ? 'removing' : 'marking as private';
      app.logger.info(`[Regex Filter Plugin] ${operation}: ${reflection.name} from: ${reflection.parent?.name}`);
    }

    if (config.exclude) {
      exclusionArray.push(reflection);
    } else if (config.markAsPrivate) {
      reflection.setFlag(ReflectionFlag.Private);
    }
  };

  app.converter.on(Converter.EVENT_CREATE_DECLARATION, (context: Context, reflection: DeclarationReflection) => {
    const config = loadConfiguration(app);
    const regex = config.regexObject;

    if (reflection.name.match(regex)) {
      onRegexMatch(config, reflection);
    }
  });

  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context: Context) => {
    const config = loadConfiguration(app);
    app.logger.info(JSON.stringify(config));

    if (config.exclude) {
      app.logger.info(`Removing ${exclusionArray.length} items`);
    }

    if (exclusionArray.length > 0) {
      exclusionArray.forEach(removedItem => {
        context.project.removeReflection(removedItem);
      });
    }
  });
}
