import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as CheckboxIndicator, p as require_jsx_runtime, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { A as Download, C as History, M as Circle, O as FileBraces, R as Check, T as FileSpreadsheet, d as RotateCcw } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { C as cn, S as applicableParameters, T as useHazardModel, _ as TableCell, a as Input, b as TableRow, c as RISK_CLASSES, d as SelectItem, f as SelectTrigger, g as TableBody, h as Table, i as HAZARDS, l as Select, m as SiteFooter, n as Button, o as Label, p as SelectValue, r as COUNTIES, s as PARAMETERS, t as AppHeader, u as SelectContent, v as TableHead, w as runModel, x as WardTable, y as TableHeader } from "./use-hazard-model-C22Zx3xd.mjs";
import { n as RadioGroupIndicator, r as RadioGroupItem$1, t as RadioGroup$1 } from "../_libs/@radix-ui/react-radio-group+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-fsTzYZjN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var RadioGroup = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup$1, {
		className: cn("grid gap-2", className),
		...props,
		ref
	});
});
RadioGroup.displayName = RadioGroup$1.displayName;
var RadioGroupItem = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem$1, {
		ref,
		className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupIndicator, {
			className: "flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5 fill-primary" })
		})
	});
});
RadioGroupItem.displayName = RadioGroupItem$1.displayName;
/** Selected AND applicable to the hazard — the criteria that moved the score. */
function effectiveCriteria(scope) {
	const applies = applicableParameters(scope.hazard);
	return scope.selected.filter((id) => applies.includes(id));
}
/**
* Whole-of-report statistics. Pure so the same numbers appear in the on-screen
* summary, the CSV footer and the JSON payload — one implementation, no drift.
*/
function summarise(results) {
	return {
		wards: results.length,
		byClass: RISK_CLASSES.map((rc) => ({
			id: rc.id,
			label: rc.label,
			count: results.filter((r) => r.risk.id === rc.id).length
		}))
	};
}
/** RFC 4180: quote a field only when it needs it, and double any inner quote. */
function csvField(value) {
	const s = String(value);
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}
var CSV_COLUMNS = [
	"county",
	"sub_county",
	"ward",
	"hazard",
	"risk_score",
	"risk_class",
	"criteria_used",
	"gradient_pct",
	"rainfall_mm",
	"temperature_c",
	"humidity_pct",
	"generated_at"
];
/** Parameter id -> its CSV column, so the two can never fall out of step. */
var PARAMETER_COLUMN = {
	gradient: "gradient_pct",
	rainfall: "rainfall_mm",
	temperature: "temperature_c",
	humidity: "humidity_pct"
};
function toCsv(results, scope) {
	const p = scope.parameters;
	const stamp = scope.generatedAt.toISOString();
	const used = effectiveCriteria(scope);
	const usedList = used.join(";");
	const valueOf = (id) => used.includes(id) ? p[id] : "";
	const lines = [CSV_COLUMNS.join(",")];
	for (const r of results) lines.push([
		r.county,
		r.subCounty,
		r.name,
		scope.hazard,
		r.score,
		r.risk.label,
		usedList,
		valueOf("gradient"),
		valueOf("rainfall"),
		valueOf("temperature"),
		valueOf("humidity"),
		stamp
	].map(csvField).join(","));
	return lines.join("\n") + "\n";
}
function toJson(results, scope) {
	const hazardLabel = HAZARDS.find((h) => h.id === scope.hazard)?.label ?? scope.hazard;
	const used = effectiveCriteria(scope);
	return JSON.stringify({
		report: "sentinel-watch-hazard-assessment",
		version: 1,
		generatedAt: scope.generatedAt.toISOString(),
		scope: {
			county: scope.county,
			subCounty: scope.subCounty === "all" ? null : scope.subCounty,
			ward: scope.ward === "all" ? null : scope.ward,
			hazard: scope.hazard,
			hazardLabel
		},
		parameters: {
			selected: used,
			ignored: scope.selected.filter((id) => !used.includes(id)),
			values: Object.fromEntries(used.map((id) => [id, scope.parameters[id]])),
			usedSystemDefaults: scope.usedDefaults,
			definitions: PARAMETERS.filter((d) => used.includes(d.id)).map((d) => ({
				id: d.id,
				label: d.label,
				unit: d.unit,
				column: PARAMETER_COLUMN[d.id]
			}))
		},
		summary: summarise(results),
		wards: results.map((r) => ({
			id: r.id,
			name: r.name,
			subCounty: r.subCounty,
			county: r.county,
			score: r.score,
			riskClass: r.risk.id,
			riskLabel: r.risk.label
		})),
		disclaimer: "Illustrative demo values from a placeholder scoring model. Not for operational decisions."
	}, null, 2);
}
/** Filesystem-safe slug: lowercase, single dashes, no leading/trailing dash. */
function slug(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
/**
* Deterministic filename. Same scope and instant always yields the same name,
* so a re-download overwrites rather than piling up "(1)" copies, and two
* different scopes never collide.
*/
function reportFilename(scope, format) {
	const parts = ["sentinel", slug(scope.county)];
	if (scope.subCounty !== "all") parts.push(slug(scope.subCounty));
	if (scope.ward !== "all") parts.push(slug(scope.ward));
	parts.push(scope.hazard);
	parts.push(scope.generatedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-"));
	return `${parts.join("_")}.${format}`;
}
function renderReport(results, scope, format) {
	return {
		filename: reportFilename(scope, format),
		mime: format === "csv" ? "text/csv;charset=utf-8" : "application/json",
		body: format === "csv" ? toCsv(results, scope) : toJson(results, scope)
	};
}
/**
* Browser-only. Kept apart from the pure builders above so the report content is
* unit-testable without a DOM.
*/
function downloadReport(file) {
	const url = URL.createObjectURL(new Blob([file.body], { type: file.mime }));
	const a = document.createElement("a");
	a.href = url;
	a.download = file.filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
var NAVY = "#0a1f44";
var FORMATS = [{
	id: "csv",
	label: "CSV",
	hint: "Ward-level rows for Excel, QGIS, R and pandas."
}, {
	id: "json",
	label: "JSON",
	hint: "Structured scope, parameters, summary and ward results."
}];
function hazardLabelOf(id) {
	return HAZARDS.find((hazard) => hazard.id === id)?.label ?? id;
}
function scopeText(scope) {
	return [
		`${scope.county} County`,
		scope.subCounty === "all" ? "All sub-counties" : scope.subCounty,
		scope.ward === "all" ? "All wards" : scope.ward
	].join(" · ");
}
function countLabel(count, noun) {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
function Reports() {
	const model = useHazardModel();
	const [format, setFormat] = (0, import_react.useState)("csv");
	const [requests, setRequests] = (0, import_react.useState)([]);
	const nextKey = (0, import_react.useRef)(0);
	const results = (0, import_react.useMemo)(() => model.canRun ? runModel(model.county, model.hazard, model.parameters, model.activeCriteria, {
		subCounty: model.subCounty === "all" ? void 0 : model.subCounty,
		ward: model.ward === "all" ? void 0 : model.ward
	}) : [], [
		model.canRun,
		model.county,
		model.hazard,
		model.subCounty,
		model.ward,
		model.parameters,
		model.activeCriteria
	]);
	const summary = (0, import_react.useMemo)(() => summarise(results), [results]);
	const rows = results.length;
	const hazardLabel = hazardLabelOf(model.hazard);
	const scopeLine = scopeText({
		county: model.county,
		subCounty: model.subCounty,
		ward: model.ward
	});
	const subCountiesCovered = new Set(results.map((result) => result.subCounty)).size;
	const latest = requests[0];
	function handleSubmit(event) {
		event.preventDefault();
		if (rows === 0) return;
		const scope = {
			county: model.county,
			subCounty: model.subCounty,
			ward: model.ward,
			hazard: model.hazard,
			parameters: model.parameters,
			selected: model.activeCriteria,
			usedDefaults: model.usesDefaults,
			generatedAt: /* @__PURE__ */ new Date()
		};
		const file = renderReport(results, scope, format);
		downloadReport(file);
		const request = {
			key: nextKey.current++,
			scope,
			format,
			rows,
			file
		};
		setRequests((previous) => [request, ...previous]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {
				county: model.county,
				lastRun: latest ? latest.scope.generatedAt : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-[1600px] flex-1 px-3 py-5 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-11 shrink-0 place-items-center text-white",
								style: { backgroundColor: NAVY },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-xl font-semibold tracking-tight sm:text-2xl",
									children: "Hazard reports"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 max-w-2xl text-sm leading-6 text-muted-foreground",
									children: "Configure an assessment, inspect the results, and export a ward-level report for documentation and review."
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "w-fit shrink-0 rounded-none border-border text-muted-foreground",
							children: "Demo dataset v1"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "mt-5 grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							"aria-labelledby": "scope-heading",
							className: "min-w-0 border border-border bg-card xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
								className: "px-4 py-3 text-white",
								style: { backgroundColor: NAVY },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: "scope-heading",
									className: "font-display text-sm font-semibold",
									children: "1. Report scope"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-white/70",
									children: "Define the area and calculation inputs."
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "scope-county",
										className: "mb-1.5 block text-xs text-muted-foreground",
										children: "County"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: model.county,
										onValueChange: model.selectCounty,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "scope-county",
											className: "rounded-none",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: COUNTIES.map((county) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: county.name,
											children: county.name
										}, county.name)) })]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "scope-sub-county",
										className: "mb-1.5 block text-xs text-muted-foreground",
										children: "Sub-county"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: model.subCounty,
										onValueChange: model.selectSubCounty,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "scope-sub-county",
											className: "rounded-none",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All sub-counties"
										}), model.subCounties.map((subCounty) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: subCounty,
											children: subCounty
										}, subCounty))] })]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										htmlFor: "scope-ward",
										className: "mb-1.5 block text-xs text-muted-foreground",
										children: "Ward"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: model.ward,
										onValueChange: model.setWard,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											id: "scope-ward",
											className: "rounded-none",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: "all",
											children: "All wards"
										}), model.wards.map((ward) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: ward,
											children: ward
										}, ward))] })]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
										className: "border-t border-border pt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
											className: "text-xs font-semibold text-muted-foreground",
											children: "Hazard type"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
											className: "mt-2 gap-2",
											value: model.hazard,
											onValueChange: (value) => {
												const selectedHazard = HAZARDS.find((hazard) => hazard.id === value);
												if (selectedHazard) model.setHazard(selectedHazard.id);
											},
											children: HAZARDS.map((hazard) => {
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `flex items-start gap-3 border p-3 transition-colors ${model.hazard === hazard.id ? "border-teal-700 bg-teal-700/5" : "border-border"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
														id: `hazard-${hazard.id}`,
														value: hazard.id,
														className: "mt-0.5 rounded-none"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
														htmlFor: `hazard-${hazard.id}`,
														className: "cursor-pointer",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "block text-sm font-medium",
															children: hazard.label
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "mt-1 block text-xs leading-5 text-muted-foreground",
															children: hazard.blurb
														})]
													})]
												}, hazard.id);
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
										className: "border-t border-border pt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
												className: "text-xs font-semibold text-muted-foreground",
												children: "Calculation criteria"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-xs leading-5 text-muted-foreground",
												children: "Select the parameters used by the model. Review their applicability before generating the report."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-3 space-y-2",
												children: PARAMETERS.map((parameter) => {
													const selected = model.selected.includes(parameter.id);
													const applicable = model.applicable.includes(parameter.id);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `border p-3 ${selected ? "border-border bg-muted/30" : "border-border/70"}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-start gap-2.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
																	id: `criterion-${parameter.id}`,
																	checked: selected,
																	onCheckedChange: () => model.toggleParameter(parameter.id),
																	className: "mt-0.5 rounded-none"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
																	htmlFor: `criterion-${parameter.id}`,
																	className: "min-w-0 flex-1 cursor-pointer text-sm leading-5",
																	children: parameter.label
																}),
																selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex shrink-0 items-center gap-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																		id: `param-${parameter.id}`,
																		type: "number",
																		value: model.parameters[parameter.id],
																		min: parameter.min,
																		max: parameter.max,
																		step: parameter.step,
																		"aria-label": `${parameter.label} value in ${parameter.unit}`,
																		onChange: (event) => {
																			const value = Number(event.target.value);
																			if (!Number.isFinite(value)) return;
																			model.setParameter(parameter.id, Math.max(parameter.min, Math.min(parameter.max, value)));
																		},
																		className: "h-8 w-20 rounded-none text-right tabular-nums"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "w-5 text-xs text-muted-foreground",
																		children: parameter.unit
																	})]
																})
															]
														}), selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "mt-2 pl-6 text-[11px] leading-5 text-muted-foreground",
															children: applicable ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
																"Range: ",
																parameter.min,
																"–",
																parameter.max,
																" ",
																parameter.unit,
																". Default: ",
																parameter.default,
																" ",
																parameter.unit,
																"."
															] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
																"Not used for ",
																hazardLabel.toLowerCase(),
																"; this parameter is excluded from the current model run."
															] })
														})]
													}, parameter.id);
												})
											}),
											model.selected.length > 0 && !model.usesDefaults && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "button",
												variant: "outline",
												size: "sm",
												onClick: model.resetParameters,
												className: "mt-3 w-full rounded-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Use system defaults"]
											})
										]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									"aria-labelledby": "preview-heading",
									className: "overflow-hidden border border-border bg-card",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
											className: "flex flex-col justify-between gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													id: "preview-heading",
													className: "font-display text-sm font-semibold",
													children: "2. Report preview"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-1 break-words text-xs text-muted-foreground",
													children: [
														hazardLabel,
														" · ",
														scopeLine
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												"aria-live": "polite",
												className: "shrink-0 text-sm text-muted-foreground",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold tabular-nums text-foreground",
														children: rows
													}),
													" ",
													rows === 1 ? "row" : "rows",
													" ready"
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
											className: "grid grid-cols-2 gap-px border-b border-border bg-border",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Rows in report",
												value: String(rows)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												label: "Sub-counties covered",
												value: String(subCountiesCovered)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
												children: "Risk-class distribution"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "mt-4 space-y-3",
												children: RISK_CLASSES.map((riskClass) => {
													const count = summary.byClass.find((item) => item.id === riskClass.id)?.count ?? 0;
													const percentage = rows === 0 ? 0 : count / rows * 100;
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
														className: "grid grid-cols-[6.5rem_minmax(0,1fr)_5.5rem] items-center gap-3",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs text-foreground",
																children: riskClass.label
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "h-2 overflow-hidden bg-muted",
																role: "img",
																"aria-label": `${riskClass.label}: ${count} wards, ${percentage.toFixed(1)} percent`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "h-full",
																	style: {
																		width: `${percentage}%`,
																		backgroundColor: `var(${riskClass.varName})`
																	}
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-right text-xs tabular-nums text-muted-foreground",
																children: [
																	count,
																	" · ",
																	Math.round(percentage),
																	"%"
																]
															})
														]
													}, riskClass.id);
												})
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									"aria-labelledby": "download-heading",
									className: "border border-border bg-card p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											id: "download-heading",
											className: "font-display text-sm font-semibold",
											children: "3. Export report"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs leading-5 text-muted-foreground",
											children: "Choose a file format. The exported file reflects the scope and parameters shown in the preview."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
											className: "mt-4 gap-3 sm:grid-cols-2",
											value: format,
											onValueChange: (value) => setFormat(value === "json" ? "json" : "csv"),
											children: FORMATS.map((item) => {
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `flex min-w-0 items-start gap-3 border p-3 ${format === item.id ? "border-teal-700 bg-teal-700/5" : "border-border"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
														id: `format-${item.id}`,
														value: item.id,
														className: "mt-1 rounded-none"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0 flex-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
																htmlFor: `format-${item.id}`,
																className: "flex cursor-pointer items-center gap-2 text-sm font-semibold",
																children: [item.id === "csv" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBraces, { className: "size-4" }), item.label]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "mt-1 text-xs leading-5 text-muted-foreground",
																children: item.hint
															}),
															item.id === "csv" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "mt-2 break-words text-[11px] leading-5 text-muted-foreground",
																children: [
																	CSV_COLUMNS.length,
																	" columns:",
																	" ",
																	CSV_COLUMNS.join(", ")
																]
															})
														]
													})]
												}, item.id);
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												type: "submit",
												size: "lg",
												disabled: rows === 0,
												className: "w-full rounded-none bg-[#0a1f44] text-white hover:bg-[#123366] sm:w-auto",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
													"Download ",
													format.toUpperCase()
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs leading-5 text-muted-foreground",
												id: "download-note",
												children: rows === 0 ? "No rows available. Widen the report scope." : `${countLabel(rows, "ward")} · ${hazardLabel} · ${model.usesDefaults ? "System defaults" : "Custom parameters"}`
											})]
										}),
										latest && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											role: "status",
											className: "mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground",
											children: [
												"Latest file:",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "break-all font-mono text-foreground",
													children: latest.file.filename
												})
											]
										})
									]
								}),
								rows === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "border border-border bg-card p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-semibold",
											children: "No wards in this scope"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs leading-5 text-muted-foreground",
											children: "Widen the selected area to include more wards in the report."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "mt-3 rounded-none",
											onClick: () => model.selectSubCounty("all"),
											children: "Reset to the whole county"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "min-w-0 border border-border bg-card",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
										className: "border-b border-border px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-semibold",
											children: "Ward-level results"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: "Review the current results before exporting."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WardTable, { results })]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						"aria-labelledby": "history-heading",
						className: "mt-5 overflow-hidden border border-border bg-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "flex flex-col justify-between gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								id: "history-heading",
								className: "flex items-center gap-2 font-display text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-4 text-muted-foreground" }), "Session report history"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: requests.length === 0 ? "No reports downloaded in this session" : `${countLabel(requests.length, "report")} · newest first`
							})]
						}), requests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 py-6 text-sm leading-6 text-muted-foreground",
							children: "Downloaded reports appear here. This history is held in memory for the current page session and clears when the page reloads."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, {
								className: "min-w-[720px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Requested (UTC)" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Scope" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Hazard" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Format" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-right",
										children: "Rows"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Filename" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
										className: "text-right",
										children: "Action"
									})
								] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: requests.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "whitespace-nowrap tabular-nums text-muted-foreground",
										title: `${entry.scope.generatedAt.toLocaleString()} local time`,
										children: entry.scope.generatedAt.toISOString().slice(11, 19)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
										className: "min-w-48",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs font-medium",
											children: scopeText(entry.scope)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block text-xs text-muted-foreground",
											children: entry.scope.usedDefaults ? "System defaults" : "Custom parameters"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "whitespace-nowrap",
										children: hazardLabelOf(entry.scope.hazard)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "rounded-none uppercase",
										children: entry.format
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right tabular-nums",
										children: entry.rows
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "max-w-56 truncate font-mono text-xs text-muted-foreground",
										title: entry.file.filename,
										children: entry.file.filename
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										className: "text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "rounded-none",
											onClick: () => downloadReport(entry.file),
											"aria-label": `Download ${entry.file.filename} again`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Again"]
										})
									})
								] }, entry.key)) })]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground",
							children: "Re-downloads use the stored report file rather than running the model again. This history is temporary and is not saved to Django or a database."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
						className: "mt-5 border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Assessment notice:" }), " The current frontend report uses the project's illustrative demo scoring model. Verify source datasets, model methodology and validation before using its results for operational decisions."]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0 bg-card px-4 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight",
			children: value
		})]
	});
}
//#endregion
export { Reports as component };
