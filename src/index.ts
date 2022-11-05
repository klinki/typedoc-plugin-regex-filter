import {
  Application,
  Context,
  Converter,
  Reflection,
  ReflectionFlag,
  DeclarationReflection,
  ParameterReflection,
  ParameterType,
  SignatureReflection,
} from "typedoc";

export type FilterScope = 'method'|'field'|'function'|'class'|'all';

export interface Configuration {
  regex: string;
  scope: FilterScope[];
  markAsPrivate: boolean;
  exclude: boolean;
  logMatches: boolean;
}

function loadConfiguration(app: Readonly<Application>): Configuration {
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
    defaultValue: true,
  });

  return {
    regex: app.options.getValue('removeRegex') as string,
    scope: ['all'], // app.options.getValue('removeRegexScope') as FilterScope[],
    exclude: app.options.getValue('removeRegexExclude') as boolean,
    markAsPrivate: app.options.getValue('removeRegexMarkAsPrivate') as boolean,
    logMatches: app.options.getValue('removeRegexLogMatches') as boolean,
  };
}

export function load(app: Readonly<Application>) {
  const config = loadConfiguration(app);
  const regex = new RegExp(config.regex);
  const scopeAll = config.scope.includes('all');

  const exclusionArray: Reflection[] = [];

  const onRegexMatch = (reflection: Reflection) => {
    if (config.logMatches) {
      const operation = config.exclude ? 'removing' : 'marking as private';
      app.logger.info(`[Regex Filter Plugin] ${operation}: ${reflection.name} from: ${reflection.parent?.name}`);
    }

    if (config.markAsPrivate) {
      reflection.setFlag(ReflectionFlag.Private);
    } else if (config.exclude) {
      exclusionArray.push(reflection);
    }
  };

  app.converter.on(Converter.EVENT_RESOLVE, (context: Context) => {
      // if (app.options.getValue("plugin-option") === "something") {
      //     // ...
      // }

      // console.log(context);
  });

  app.converter.on(Converter.EVENT_CREATE_PARAMETER, (context: Context, reflection: ParameterReflection) => {
      if (reflection.name.startsWith('_')) {
        // console.log(reflection.name);
      }
  });

  app.converter.on(Converter.EVENT_CREATE_SIGNATURE, (context: Context, reflection: SignatureReflection) => {
    if (reflection.name.startsWith('_')) {
      // console.log('signature', reflection.name);
    }
  });

  app.converter.on(Converter.EVENT_CREATE_DECLARATION, (context: Context, reflection: DeclarationReflection) => {
    if (reflection.name.match(regex)) {
      onRegexMatch(reflection);
      // if (config.markAsPrivate) {
      //   reflection.flags.setFlag(ReflectionFlag.Private, true);
      // }
    }

    // if (reflection.name.startsWith('_')) {
    //   console.log('declaration', reflection.name);
    // }
  });

  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context: Context) => {
    if (exclusionArray.length > 0) {
      exclusionArray.forEach(removedItem => {
        context.project.removeReflection(removedItem);
      });
    }
  });
}
