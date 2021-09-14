// This export is needed to trick the compiler while developing the modules:
//   - while developing, `environment.ts` is searched in the root folder (we need an any type to avoid conflicts);
//   - when publishing, `environment.ts` is searched in the module's root (because of the modules' `tsconfig.lib.json`).
// Without the current configuration, when publishing multiple modules, the first environment loaded doesn't change,
// and it could happen that the compiler can't find some of the environment variables needed.
export const environment = {} as any;
