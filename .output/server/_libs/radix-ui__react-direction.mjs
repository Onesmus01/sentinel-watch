import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "./@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "./@radix-ui/react-checkbox+[...].mjs";
//#region node_modules/.pnpm/@radix-ui+react-direction@1_69ac9a3671675562f99117e4e4737ce2/node_modules/@radix-ui/react-direction/dist/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
require_jsx_runtime();
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
var Direction = {
	LTR: "ltr",
	RTL: "rtl"
};
var DirectionContext = import_react.createContext(void 0);
function useDirection(localDir) {
	const globalDir = import_react.useContext(DirectionContext);
	return localDir || globalDir || Direction.LTR;
}
__name(useDirection, "useDirection");
//#endregion
export { useDirection as t };
