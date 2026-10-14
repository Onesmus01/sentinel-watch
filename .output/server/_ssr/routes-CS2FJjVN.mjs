import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { E as FileOutput, I as ChevronRight, L as ChevronDown, N as CircleCheck, P as CircleAlert, U as Activity, a as Sparkles, c as ShieldAlert, d as RotateCcw, f as Play, g as Map, h as Maximize2, i as TrendingUp, j as Crosshair, k as Droplets, l as Search, n as Waves, o as SlidersHorizontal, p as Minimize2, r as TriangleAlert, t as X, u as Ruler, v as MapPin, x as Layers, y as LoaderCircle, z as Calculator } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { C as cn, T as useHazardModel, a as Input, c as RISK_CLASSES$1, d as SelectItem, f as SelectTrigger, i as HAZARDS, l as Select, m as SiteFooter, n as Button, o as Label, p as SelectValue, s as PARAMETERS, t as AppHeader, u as SelectContent, x as WardTable } from "./use-hazard-model-C22Zx3xd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CS2FJjVN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RISK_COLORS = {
	veryLow: "#16a34a",
	low: "#84cc16",
	moderate: "#eab308",
	high: "#f97316",
	veryHigh: "#dc2626"
};
var RISK_CLASS_STYLES = [
	{
		label: "Very Low",
		color: RISK_COLORS.veryLow,
		background: "#f0fdf4",
		border: "#bbf7d0",
		text: "#166534"
	},
	{
		label: "Low",
		color: RISK_COLORS.low,
		background: "#f7fee7",
		border: "#d9f99d",
		text: "#3f6212"
	},
	{
		label: "Moderate",
		color: RISK_COLORS.moderate,
		background: "#fefce8",
		border: "#fde68a",
		text: "#854d0e"
	},
	{
		label: "High",
		color: RISK_COLORS.high,
		background: "#fff7ed",
		border: "#fed7aa",
		text: "#9a3412"
	},
	{
		label: "Very High",
		color: RISK_COLORS.veryHigh,
		background: "#fef2f2",
		border: "#fecaca",
		text: "#991b1b"
	}
];
function getRiskStyle(label) {
	return RISK_CLASS_STYLES.find((i) => i.label.toLowerCase() === label.trim().toLowerCase()) ?? {
		label,
		color: "#64748b",
		background: "#f8fafc",
		border: "#e2e8f0",
		text: "#334155"
	};
}
var NAVY = "#0a1f44";
var FLOOD_WEIGHT_FIELDS = [
	{
		key: "dist_to_river",
		label: "Distance to river",
		description: "Influence of proximity to rivers.",
		color: RISK_COLORS.veryLow
	},
	{
		key: "rainfall",
		label: "Rainfall",
		description: "Influence of rainfall conditions.",
		color: RISK_COLORS.moderate
	},
	{
		key: "landcover",
		label: "Land cover",
		description: "Influence of land-cover characteristics.",
		color: RISK_COLORS.high
	}
];
var card = "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/[0.04]";
function Section({ title, subtitle, children, icon, step }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "px-3 pt-3 sm:px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: card,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute inset-y-0 left-0 w-1",
						style: { background: `linear-gradient(${NAVY}, ${RISK_COLORS.veryLow})` }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-slate-900/20",
						style: { background: `linear-gradient(135deg, ${NAVY}, #1e3a6e)` },
						children: [icon, typeof step === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-green-600 text-[9px] font-bold text-white",
							children: step
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-extrabold tracking-tight text-slate-900",
							children: title
						}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-xs text-slate-500",
							children: subtitle
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-4",
				children
			})]
		})
	});
}
var Field = ({ label, children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "min-w-0 space-y-1.5",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
		className: "block text-[13px] font-semibold text-slate-700",
		children: label
	}), children]
});
var HelperMessage = ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
	className: "mt-1.5 text-xs leading-5 text-slate-500",
	children
});
var ErrorMessage = ({ message }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
	role: "alert",
	className: "mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs leading-5 text-red-700",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-3.5 shrink-0" }), message]
});
var LoadingMessage = ({ message }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
	className: "mt-2 flex items-center gap-2 text-xs text-slate-500",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }), message]
});
function InfoBanner({ icon, tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-start gap-2.5 rounded-xl border p-3 ${{
			amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-900 [&_svg]:text-amber-600",
			slate: "border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-600 [&_svg]:text-slate-500"
		}[tone]}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 shrink-0",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs leading-5",
			children
		})]
	});
}
var inputClass = "h-11 rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-800 shadow-inner shadow-slate-900/[0.02] transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus-visible:border-[#0a1f44] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#0a1f44]/10 disabled:bg-slate-100 disabled:text-slate-400";
var selectTriggerClass = "h-11 w-full rounded-xl border-slate-200 bg-slate-50/60 text-sm text-slate-800 shadow-inner shadow-slate-900/[0.02] transition-all hover:border-slate-300 hover:bg-white focus:ring-4 focus:ring-[#0a1f44]/10";
var selectContentClass = "rounded-xl border-slate-200 bg-white text-slate-800 shadow-xl shadow-slate-900/10";
function ControlSidebar({ model }) {
	const running = model.status === "running";
	const isFlood = model.hazard === "flood";
	const selectedSet = new Set(model.selected);
	const activeSet = new Set(model.activeCriteria);
	const ignoredSet = new Set(model.ignoredCriteria);
	const floodSummary = model.floodCalculation?.summary ?? [];
	const w = model.floodWeights;
	const totalWeight = w.dist_to_river + w.rainfall + w.landcover;
	const weightsAreValid = Number.isFinite(totalWeight) && Math.abs(totalWeight - 100) < .01 && FLOOD_WEIGHT_FIELDS.every(({ key }) => Number.isFinite(w[key]) && w[key] >= 0 && w[key] <= 100);
	const canRun = !running && model.canRun && (isFlood ? weightsAreValid : model.activeCriteria.length > 0);
	const topClass = floodSummary.length ? [...floodSummary].sort((a, b) => b.percentage - a.percentage)[0] : null;
	const totalArea = floodSummary.reduce((s, i) => s + i.area_km2, 0);
	function normalizeFloodWeights() {
		const total = w.dist_to_river + w.rainfall + w.landcover;
		if (!Number.isFinite(total) || total <= 0) return;
		const distance = Number((w.dist_to_river / total * 100).toFixed(2));
		const rainfall = Number((w.rainfall / total * 100).toFixed(2));
		const landcover = Number((100 - distance - rainfall).toFixed(2));
		model.setFloodWeight("dist_to_river", distance);
		model.setFloodWeight("rainfall", rainfall);
		model.setFloodWeight("landcover", landcover);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "control-sidebar flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .control-sidebar .scroll-area{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;
          background-image:radial-gradient(#cbd5e1 1px,transparent 1px);background-size:18px 18px}
        .control-sidebar .scroll-area::-webkit-scrollbar{width:6px}
        .control-sidebar .scroll-area::-webkit-scrollbar-track{background:transparent}
        .control-sidebar .scroll-area::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
        .control-sidebar .scroll-area::-webkit-scrollbar-thumb:hover{background:#94a3b8}
        @keyframes control-sidebar-shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}}
        .control-sidebar .run-shimmer::after{content:"";position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.24) 50%,transparent 60%);
          animation:control-sidebar-shimmer 2.6s ease-in-out infinite}
        @keyframes control-sidebar-pulse{0%,100%{opacity:1}50%{opacity:.45}}
        .control-sidebar .pulse-dot{animation:control-sidebar-pulse 1.6s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.control-sidebar .run-shimmer::after,.control-sidebar .pulse-dot{animation:none}}
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative shrink-0 overflow-hidden border-b border-blue-950 bg-[#0a1f44] px-4 py-5 text-white sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none absolute inset-0 opacity-[0.055]",
					style: {
						backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
						backgroundSize: "28px 28px"
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex items-center gap-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-base font-extrabold tracking-tight text-white",
								children: "Analysis workspace"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 flex items-center gap-1.5 text-xs text-slate-200",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3" }), "Configure your hazard assessment"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pulse-dot size-1.5 rounded-full bg-white" }), "GIS"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Hazard selection",
						subtitle: "Choose what to assess",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-[18px]" }),
						step: 1,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: HAZARDS.map((hazard) => {
								const active = model.hazard === hazard.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => model.setHazard(hazard.id),
									"aria-pressed": active,
									className: `group relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1f44] focus-visible:ring-offset-2 ${active ? "border-[#0a1f44]/40 bg-gradient-to-r from-[#0a1f44]/[0.06] via-white to-white shadow-md shadow-[#0a1f44]/10" : "border-slate-200 bg-white hover:-translate-y-px hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5"}`,
									children: [active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute inset-y-0 left-0 w-1",
										style: { background: NAVY }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative flex items-start gap-3 pl-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `flex size-10 shrink-0 items-center justify-center rounded-xl transition-all ${active ? "text-white shadow-md shadow-[#0a1f44]/30" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800"}`,
												style: active ? { background: `linear-gradient(135deg, ${NAVY}, #1e3a6e)` } : void 0,
												children: hazard.id === "flood" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-[18px]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-[18px]" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block text-sm font-bold text-slate-900",
													children: hazard.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-1 block text-xs leading-5 text-slate-500",
													children: hazard.blurb
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "flex h-10 shrink-0 items-center",
												children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5 text-green-600" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" })
											})
										]
									})]
								}, hazard.id);
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Geographic area",
						subtitle: "County, sub-county and ward",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-[18px]" }),
						step: 2,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: model.query,
										onChange: (e) => model.setQuery(e.target.value),
										placeholder: "Search counties...",
										"aria-label": "Search county",
										className: `${inputClass} pl-10 pr-10`
									}),
									model.query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "Clear search",
										onClick: () => model.setQuery(""),
										className: "absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mt-5 space-y-4 pl-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-3 left-[3px] top-3 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-transparent" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
										label: "County",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: model.county,
												onValueChange: model.selectCounty,
												disabled: model.countiesLoading || model.filteredCounties.length === 0,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: selectTriggerClass,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: model.countiesLoading ? "Loading counties..." : model.countiesError ? "Counties unavailable" : model.filteredCounties.length === 0 ? "No counties found" : "Select county" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
													className: selectContentClass,
													children: model.filteredCounties.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: c.name,
														children: c.name
													}, c.name))
												})]
											}),
											model.countiesError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorMessage, { message: model.countiesError }),
											!model.countiesLoading && !model.countiesError && model.filteredCounties.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperMessage, { children: "No counties match your search." })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
										label: "Sub-county",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: model.subCounty,
												onValueChange: model.selectSubCounty,
												disabled: !model.county || model.subCountiesLoading || model.subCounties.length === 0,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: selectTriggerClass,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: model.subCountiesLoading ? "Loading sub-counties..." : model.subCountiesError ? "Sub-counties unavailable" : "All sub-counties" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
													className: selectContentClass,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														children: "All sub-counties"
													}), model.subCounties.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: s,
														children: s
													}, s))]
												})]
											}),
											model.subCountiesLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingMessage, { message: "Loading sub-counties..." }),
											model.subCountiesError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorMessage, { message: model.subCountiesError }),
											!model.subCountiesLoading && !model.subCountiesError && model.subCounties.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperMessage, { children: "No sub-counties were returned for this county." })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
										label: "Ward",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: model.ward,
												onValueChange: model.setWard,
												disabled: !model.county || model.wardsLoading || model.wards.length === 0,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													className: selectTriggerClass,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: model.wardsLoading ? "Loading wards..." : model.wardsError ? "Wards unavailable" : "All wards" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, {
													className: selectContentClass,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														children: "All wards"
													}), model.wards.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: x,
														children: x
													}, x))]
												})]
											}),
											model.wardsLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingMessage, { message: "Loading wards..." }),
											model.wardsError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorMessage, { message: model.wardsError }),
											!model.wardsLoading && !model.wardsError && model.wards.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperMessage, { children: "No wards were returned for this county." })
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoBanner, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" }),
									tone: "amber",
									children: "The flood endpoint currently uses its configured GIS area. Location selections do not yet change the backend calculation area."
								})
							})
						]
					}),
					isFlood ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Flood calculator",
						subtitle: "GIS-based weighted risk assessment",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator, { className: "size-[18px]" }),
						step: 3,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a1f44] shadow-sm ring-1 ring-slate-200",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-extrabold text-slate-900",
											children: "Flood susceptibility"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-0.5 text-xs leading-5 text-slate-500",
											children: [
												"Adjust each factor. The combined weight must equal ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-slate-800",
													children: "100%"
												}),
												"."
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0a1f44] px-2.5 py-1 text-[10px] font-bold text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-3" }), "3"]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200",
									role: "img",
									"aria-label": FLOOD_WEIGHT_FIELDS.map((f) => `${f.label} ${w[f.key]}%`).join(", "),
									children: FLOOD_WEIGHT_FIELDS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full transition-all duration-300",
										style: {
											width: `${Math.min(100, Math.max(0, w[f.key]))}%`,
											background: f.color
										}
									}, f.key))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3",
								children: FLOOD_WEIGHT_FIELDS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:border-slate-300 hover:bg-white",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mb-2.5 flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "size-3 rounded-md shadow-sm ring-1 ring-black/10",
													style: { background: f.color }
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "flex-1 text-[13px] font-bold text-slate-800",
													children: f.label
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-bold tabular-nums text-slate-500",
													children: [Number(w[f.key]).toFixed(1), "%"]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												inputMode: "decimal",
												min: 0,
												max: 100,
												step: "0.01",
												value: w[f.key],
												disabled: running,
												"aria-label": `${f.label} weight percentage`,
												onChange: (e) => {
													const raw = e.currentTarget.value;
													if (raw.trim() === "") return;
													const v = Number(raw);
													if (!Number.isFinite(v)) return;
													model.setFloodWeight(f.key, Math.min(100, Math.max(0, v)));
												},
												className: `${inputClass} bg-white pr-10 font-bold tabular-nums`
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400",
												children: "%"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperMessage, { children: f.description })
									]
								}, f.key))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5",
									style: { backgroundColor: weightsAreValid ? "#f0fdf4" : "#fffbeb" },
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-slate-800",
										children: "Combined weight"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-xs text-slate-500",
										children: "Weight allocation check"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "rounded-xl border bg-white px-3 py-1.5 text-lg font-extrabold tabular-nums shadow-sm",
										style: {
											color: weightsAreValid ? "#166534" : "#92400e",
											borderColor: weightsAreValid ? "#bbf7d0" : "#fde68a"
										},
										children: [totalWeight.toFixed(2), "%"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-4 pb-4 pt-3.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-2.5 overflow-hidden rounded-full bg-slate-100",
											role: "progressbar",
											"aria-label": "Total weight percentage",
											"aria-valuemin": 0,
											"aria-valuemax": 100,
											"aria-valuenow": Math.min(100, Math.max(0, totalWeight)),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full rounded-full transition-[width] duration-300",
												style: {
													width: `${Math.min(100, Math.max(0, totalWeight))}%`,
													backgroundColor: weightsAreValid ? RISK_COLORS.veryLow : RISK_COLORS.moderate
												}
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex items-start gap-2",
											children: [weightsAreValid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
												className: "mt-0.5 size-4 shrink-0",
												style: { color: RISK_COLORS.veryLow }
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
												className: "mt-0.5 size-4 shrink-0",
												style: { color: RISK_COLORS.moderate }
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs leading-5",
												style: { color: weightsAreValid ? "#166534" : "#854d0e" },
												children: weightsAreValid ? "Your weights are balanced and ready for calculation." : "The three weights must total exactly 100% before you can run the calculation."
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											onClick: normalizeFloodWeights,
											disabled: running || !Number.isFinite(totalWeight) || totalWeight <= 0,
											className: "mt-4 h-10 w-full rounded-xl border-slate-300 bg-white font-bold text-slate-700 shadow-none hover:border-[#0a1f44]/40 hover:bg-slate-50 hover:text-[#0a1f44]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator, { className: "mr-2 size-4" }), "Normalize weights to 100%"]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "ghost",
								onClick: model.resetFloodWeights,
								disabled: running,
								className: "mt-3 h-10 w-full rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "mr-2 size-4" }), "Restore default weights"]
							})
						]
					}), model.status === "done" && model.floodCalculation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Calculation results",
						subtitle: model.lastRun ? model.lastRun.toLocaleString() : "Latest run",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-[18px]" }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 grid grid-cols-2 gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "flex items-center gap-1.5 text-[11px] font-semibold text-slate-500",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3.5" }), "Largest class"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1.5 truncate text-sm font-extrabold",
											style: { color: topClass ? getRiskStyle(topClass.label).text : "#334155" },
											children: topClass?.label ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tabular-nums text-slate-500",
											children: topClass ? `${topClass.percentage.toFixed(1)}% of area` : "No summary"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "flex items-center gap-1.5 text-[11px] font-semibold text-slate-500",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ruler, { className: "size-3.5" }), "Total area"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1.5 text-sm font-extrabold tabular-nums text-slate-900",
											children: [totalArea.toLocaleString(void 0, { maximumFractionDigits: 1 }), " km²"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-slate-500",
											children: [floodSummary.length, " risk classes"]
										})
									]
								})]
							}),
							floodSummary.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "overflow-hidden rounded-xl border border-slate-200 bg-white",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-b border-slate-200 bg-slate-50 px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-slate-800",
											children: "Flood risk distribution"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-0.5 text-xs text-slate-500",
											children: "Area and percentage by risk class"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-3.5 overflow-hidden",
										children: floodSummary.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											title: `${i.label}: ${i.percentage.toFixed(2)}%`,
											style: {
												width: `${Math.min(100, Math.max(0, i.percentage))}%`,
												background: getRiskStyle(i.label).color
											}
										}, i.class))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full min-w-[300px] text-left text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "border-b border-slate-200 text-slate-500",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 text-[10px] font-bold uppercase tracking-wider",
														children: "Risk class"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider",
														children: "Area km²"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider",
														children: "Share"
													})
												]
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: floodSummary.map((item) => {
												const risk = getRiskStyle(item.label);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "border-b border-slate-100 last:border-b-0 hover:bg-slate-50",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-semibold",
																style: {
																	color: risk.text,
																	backgroundColor: risk.background,
																	borderColor: risk.border
																},
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "size-2 rounded-full",
																	style: { backgroundColor: risk.color }
																}), item.label]
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "px-4 py-3 text-right tabular-nums text-slate-600",
															children: item.area_km2.toLocaleString(void 0, { maximumFractionDigits: 2 })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "px-4 py-3 text-right",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "font-bold tabular-nums",
																style: { color: risk.text },
																children: [item.percentage.toFixed(2), "%"]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "mt-1 ml-auto block h-1 w-14 overflow-hidden rounded-full bg-slate-100",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "block h-full rounded-full",
																	style: {
																		width: `${Math.min(100, item.percentage)}%`,
																		background: risk.color
																	}
																})
															})]
														})
													]
												}, item.class);
											}) })]
										})
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelperMessage, { children: "The backend completed the calculation but returned no risk-class summary rows." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 space-y-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-2 text-sm font-bold text-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileOutput, { className: "size-4 text-slate-600" }), "Generated GIS outputs"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-slate-500",
									children: "Output references returned by the calculation service."
								})] }), Object.entries(model.floodCalculation.outputs).map(([name, path]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold capitalize text-slate-700",
											children: name.replaceAll("_", " ")
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2.5 break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-[11px] leading-5 text-slate-300",
										children: path
									})]
								}, name))]
							})
						]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Model parameters",
						subtitle: "Drought and landslide criteria",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-[18px]" }),
						step: 3,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoBanner, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }),
									tone: "slate",
									children: "Select criteria and enter values for drought or landslide analysis. These hazards still use the temporary frontend model rather than the real Django GIS calculation."
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-[#0a1f44] px-3 py-1.5 text-xs font-bold text-white",
									children: [model.selected.length, " selected"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: model.clearParameters,
									disabled: model.selected.length === 0 || running,
									className: "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), "Clear all"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3",
								children: PARAMETERS.map((p) => {
									const checked = selectedSet.has(p.id);
									const applicable = activeSet.has(p.id);
									const ignored = ignoredSet.has(p.id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `rounded-xl border p-3.5 transition-all ${checked ? "border-[#0a1f44]/40 bg-gradient-to-br from-[#0a1f44]/[0.04] to-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex min-h-7 cursor-pointer items-center gap-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked,
														disabled: running,
														onChange: () => model.toggleParameter(p.id),
														className: "size-4 shrink-0 cursor-pointer accent-green-700"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "flex-1 text-sm font-bold text-slate-800",
														children: p.label
													}),
													applicable && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-bold text-green-800",
														children: "Applicable"
													})
												]
											}),
											ignored && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-2 flex items-center gap-1.5 pl-7 text-xs leading-5 text-amber-700",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-3.5 shrink-0" }),
													"This criterion is not used for ",
													model.hazard,
													"."
												]
											}),
											checked && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 border-t border-slate-200 pt-3.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
													htmlFor: `parameter-${p.id}`,
													className: "mb-2 block text-xs font-semibold text-slate-600",
													children: [
														p.label,
														" (",
														p.unit,
														")"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: `parameter-${p.id}`,
														type: "number",
														min: p.min,
														max: p.max,
														step: p.step,
														value: model.parameters[p.id],
														disabled: running,
														onChange: (e) => {
															const v = e.currentTarget.valueAsNumber;
															if (!Number.isFinite(v)) return;
															model.setParameter(p.id, Math.min(p.max, Math.max(p.min, v)));
														},
														className: `${inputClass} min-w-0 flex-1 bg-white font-bold`
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold tabular-nums text-slate-500",
														children: [
															p.min,
															"–",
															p.max
														]
													})]
												})]
											})
										]
									}, p.id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Applicable criteria: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-slate-800",
										children: model.activeCriteria.length
									}),
									".",
									" ",
									model.activeCriteria.length === 0 ? "Select at least one." : "Ready for review."
								] }), model.usesDefaults ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex shrink-0 items-center gap-1 text-slate-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), "Defaults"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: model.resetParameters,
									disabled: running,
									className: "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-bold text-[#0a1f44] hover:bg-slate-200 disabled:opacity-40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Restore defaults"]
								})]
							})
						]
					}),
					model.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "px-3 pt-3 sm:px-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							role: "alert",
							className: "overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-900/20",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-extrabold text-red-900",
										children: "Calculation failed"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1.5 whitespace-pre-wrap break-words rounded-lg border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-red-800",
										children: model.error
									})]
								})]
							})
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "z-10 shrink-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void model.run(),
					disabled: !canRun,
					size: "lg",
					className: `run-shimmer relative h-12 w-full overflow-hidden rounded-xl font-extrabold text-white transition-all focus-visible:ring-2 focus-visible:ring-[#0a1f44] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${canRun && !running ? "bg-gradient-to-r from-[#0a1f44] via-[#12306a] to-[#1e4a9a] shadow-lg shadow-[#0a1f44]/35 ring-1 ring-inset ring-white/10 hover:brightness-125 hover:shadow-xl active:scale-[0.99]" : "bg-slate-300"}`,
					children: running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 size-4 animate-spin" }), "Running GIS calculation..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "mr-2 size-4 fill-current" }), "Run calculation"] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					"aria-live": "polite",
					className: "mt-3 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-slate-500",
					children: running ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }), "Waiting for the calculation service..."] }) : isFlood ? !weightsAreValid ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
						className: "size-3.5 shrink-0",
						style: { color: RISK_COLORS.moderate }
					}), "Weights must total 100%"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
						className: "size-3.5 shrink-0",
						style: { color: RISK_COLORS.veryLow }
					}), "Ready to run flood GIS analysis"] }) : model.activeCriteria.length === 0 ? "Select an applicable criterion to continue" : "Runs the temporary frontend model"
				})]
			})
		]
	});
}
/** Kenya's full extent, used for the default view. */
var KENYA_BOUNDS = [[-4.68, 33.91], [4.62, 41.91]];
var KENYA_CENTER = {
	lat: (KENYA_BOUNDS[0][0] + KENYA_BOUNDS[1][0]) / 2,
	lon: (KENYA_BOUNDS[0][1] + KENYA_BOUNDS[1][1]) / 2
};
/**
* County extents, for panning when the analyst changes scope. Sourced as above;
* these are administrative boundaries, not settlement points, so a county the
* size of Baringo frames correctly instead of centring on its main town.
*/
var COUNTY_BOUNDS = {
	Nairobi: [[-1.4448822, 36.6647016], [-1.1606749, 37.1048735]],
	Kisumu: [[-.416827, 34.4169364], [.0226311, 35.343328]],
	Baringo: [[-.2264637, 35.5234935], [1.654467, 36.4895072]],
	"Murang'a": [[-1.0960447, 36.7064872], [-.5673347, 37.4213309]]
};
function countyBounds(county) {
	return COUNTY_BOUNDS[county] ?? null;
}
var EARTH_CIRCUMFERENCE_M = 40075016.686;
/**
* Ground resolution of a Web Mercator tile pyramid: metres covered by one CSS
* pixel. Shrinks with latitude, which is why the scale bar is only meaningful
* for a stated latitude.
*/
function metresPerPixel(lat, zoom) {
	return EARTH_CIRCUMFERENCE_M * Math.cos(lat * Math.PI / 180) / 2 ** (zoom + 8);
}
/**
* What Leaflet's scale control will actually print, in metres: the largest
* 1/2/3/5 x 10^n that still fits inside `maxWidthPx`. Reimplemented here (it is
* ten lines) so the app's headline scale figure is asserted by a unit test
* instead of read off a screenshot.
*/
function scaleBarMetres(lat, zoom, maxWidthPx = 100) {
	const span = metresPerPixel(lat, zoom) * maxWidthPx;
	const pow10 = 10 ** Math.floor(Math.log10(span));
	const d = span / pow10;
	return pow10 * (d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1);
}
/**
* OpenStreetMap's public tile server.
*
* Its usage policy forbids production or heavy use, and the ODbL requires the
* attribution below to stay visible. Both are why this is documented in the
* README as a demo-only default: a deployment needs a commercial provider or a
* self-hosted renderer, which is a change of these two constants and nothing
* else.
*/
var TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
var TILE_ATTRIBUTION = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors";
var API_BASE_URL = "http://127.0.0.1:8000/api";
var GEOSERVER_WMS_URL = "http://192.168.0.40:8080/geoserver/wms";
var FLOOD_LAYER = "TanaRiver_Floods:TanaRiver_Flood_Hotspots";
var WARD_LAYER = "Rangelands:wards";
var RAINFALL_LAYER = "Hazards_Dashboard:TanaRiver_Rainfall";
var LANDCOVER_LAYER = "Hazards_Dashboard:TanaRiver_LULC";
var SLOPE_LAYER = "Hazards_Dashboard:TanaRiver_Slope";
var RIVER_LAYER = "Hazards_Dashboard:TR_Rivers";
var SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
var TANA_RIVER_BOUNDS = [[-3.0729, 38.4342], [-.0155, 40.7306]];
var RISK_CLASSES = [
	{
		label: "Very Low",
		color: "#16a34a"
	},
	{
		label: "Low",
		color: "#a3d977"
	},
	{
		label: "Moderate",
		color: "#facc15"
	},
	{
		label: "High",
		color: "#f97316"
	},
	{
		label: "Very High",
		color: "#dc2626"
	}
];
var isAll = (v) => !v || v.trim().toLowerCase() === "all";
var hazardLabels = {
	flood: "Flood susceptibility",
	drought: "Drought risk",
	landslide: "Landslide risk"
};
var MAP_CSS = `
.mapframe .leaflet-container{font-family:inherit;background:#e2e8f0}
.mapframe .leaflet-bar,.mapframe .leaflet-control-layers{border:1px solid rgb(226 232 240/.9)!important;border-radius:14px!important;box-shadow:0 8px 24px rgb(15 23 42/.14)!important;overflow:hidden;background:rgb(255 255 255/.95);backdrop-filter:blur(8px)}
.mapframe .leaflet-bar a{width:36px;height:36px;line-height:36px;color:#334155;border-bottom-color:#e2e8f0}
.mapframe .leaflet-bar a:hover{background:#f0fdfa;color:#0f766e}
.mapframe .leaflet-control-layers-toggle{width:40px;height:40px}
.mapframe .leaflet-control-layers-expanded{padding:12px 14px;font-size:12px;color:#334155;min-width:170px}
.mapframe .leaflet-control-layers label{display:block;padding:3px 0;cursor:pointer}
.mapframe .leaflet-control-scale-line{border-color:#0f766e;background:rgb(255 255 255/.85);color:#334155;font-size:10px;font-weight:600;border-radius:0 0 6px 6px}
.mapframe .leaflet-control-attribution{background:rgb(255 255 255/.8)!important;font-size:9px;border-radius:8px 0 0 0;backdrop-filter:blur(6px)}
.dark .mapframe .leaflet-bar,.dark .mapframe .leaflet-control-layers{background:rgb(15 23 42/.95);border-color:#334155!important;color:#e2e8f0}
.dark .mapframe .leaflet-bar a{background:transparent;color:#e2e8f0;border-bottom-color:#334155}
.dark .mapframe .leaflet-control-layers-expanded{color:#e2e8f0}
.mapframe .leaflet-container:focus-visible{outline:2px solid #14b8a6;outline-offset:-2px}
`;
var glass = "border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-950/90";
var iconBtn = "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-teal-950";
function MapFrame({ county, subCounty = "all", ward = "all", status, hazard = "flood", className = "" }) {
	const root = (0, import_react.useRef)(null);
	const holder = (0, import_react.useRef)(null);
	const coords = (0, import_react.useRef)(null);
	const map = (0, import_react.useRef)(null);
	const floodLayer = (0, import_react.useRef)(null);
	const boundaryLayer = (0, import_react.useRef)(null);
	const requestId = (0, import_react.useRef)(0);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [boundaryError, setBoundaryError] = (0, import_react.useState)(null);
	const [framed, setFramed] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [fullscreen, setFullscreen] = (0, import_react.useState)(false);
	const [legendOpen, setLegendOpen] = (0, import_react.useState)(true);
	const [opacity, setOpacity] = (0, import_react.useState)(82);
	const [toast, setToast] = (0, import_react.useState)(false);
	const isFlood = hazard === "flood";
	const scaleKm = Math.round(scaleBarMetres(KENYA_CENTER.lat, 6) / 1e3);
	const showKenya = (0, import_react.useCallback)(() => {
		requestId.current += 1;
		const instance = map.current;
		if (!instance) return;
		if (boundaryLayer.current) {
			instance.removeLayer(boundaryLayer.current);
			boundaryLayer.current = null;
		}
		instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], 6, { duration: .8 });
		setFramed(null);
		setBoundaryError(null);
	}, []);
	const toggleFullscreen = (0, import_react.useCallback)(() => {
		if (document.fullscreenElement) document.exitFullscreen();
		else root.current?.requestFullscreen?.();
	}, []);
	(0, import_react.useEffect)(() => {
		const onChange = () => {
			setFullscreen(document.fullscreenElement === root.current);
			setTimeout(() => map.current?.invalidateSize({ pan: false }), 150);
		};
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		let cleanup;
		async function initializeMap() {
			try {
				const L = await import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
				if (cancelled || !holder.current || map.current) return;
				const instance = L.map(holder.current, {
					center: [KENYA_CENTER.lat, KENYA_CENTER.lon],
					zoom: 6,
					maxBounds: [[-12, 26], [12, 50]],
					maxBoundsViscosity: .8,
					minZoom: 5,
					maxZoom: 19,
					scrollWheelZoom: false,
					attributionControl: true,
					zoomControl: false
				});
				L.control.zoom({ position: "topleft" }).addTo(instance);
				const osm = L.tileLayer(TILE_URL, {
					attribution: TILE_ATTRIBUTION,
					maxZoom: 19
				});
				const satellite = L.tileLayer(SATELLITE_URL, {
					attribution: "Tiles © Esri",
					maxZoom: 18
				});
				const wms = (layers, opacity, attribution) => L.tileLayer.wms(GEOSERVER_WMS_URL, {
					layers,
					format: "image/png",
					transparent: true,
					version: "1.1.1",
					opacity,
					tiled: true,
					attribution
				});
				const flood = wms(FLOOD_LAYER, .82, "Flood hotspots · Sentinel Watch GeoServer");
				const wards = wms(WARD_LAYER, .85, "Ward boundaries · Sentinel Watch GeoServer");
				const rainfall = wms(RAINFALL_LAYER, .7, "Rainfall · Sentinel Watch GeoServer");
				const landcover = wms(LANDCOVER_LAYER, .75, "Land cover · Sentinel Watch GeoServer");
				const slope = wms(SLOPE_LAYER, .7, "Slope · Sentinel Watch GeoServer");
				const rivers = wms(RIVER_LAYER, .95, "River network · Sentinel Watch GeoServer");
				osm.addTo(instance);
				if (hazard === "flood") flood.addTo(instance);
				const toggle = L.control.layers({
					"Street map": osm,
					Satellite: satellite
				}, {
					"Flood hotspots": flood,
					Rainfall: rainfall,
					"Land cover": landcover,
					Slope: slope,
					"River network": rivers,
					"Ward boundaries": wards
				}, {
					collapsed: true,
					position: "topright"
				}).addTo(instance).getContainer()?.querySelector(".leaflet-control-layers-toggle");
				toggle?.setAttribute("title", "Show or hide map layers");
				toggle?.setAttribute("aria-label", "Show or hide map layers");
				L.control.scale({
					metric: true,
					imperial: false,
					maxWidth: 100,
					position: "bottomleft"
				}).addTo(instance);
				instance.on("mousemove", (e) => {
					if (coords.current) coords.current.textContent = `${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°`;
				});
				instance.on("click", () => instance.scrollWheelZoom.enable());
				instance.on("mouseout", () => instance.scrollWheelZoom.disable());
				floodLayer.current = flood;
				map.current = instance;
				const resize = () => {
					if (!cancelled && map.current === instance) instance.invalidateSize({ pan: false });
				};
				const observer = new ResizeObserver(resize);
				if (holder.current) observer.observe(holder.current);
				requestAnimationFrame(resize);
				setFailed(false);
				setReady(true);
				cleanup = () => {
					observer.disconnect();
					boundaryLayer.current = null;
					floodLayer.current = null;
					instance.remove();
					if (map.current === instance) map.current = null;
					setReady(false);
				};
			} catch (error) {
				console.error("Failed to initialize hazard map:", error);
				if (!cancelled) setFailed(true);
			}
		}
		initializeMap();
		return () => {
			cancelled = true;
			requestId.current += 1;
			cleanup?.();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const instance = map.current;
		const layer = floodLayer.current;
		if (!ready || !instance || !layer) return;
		if (isFlood) {
			if (!instance.hasLayer(layer)) layer.addTo(instance);
		} else if (instance.hasLayer(layer)) instance.removeLayer(layer);
	}, [isFlood, ready]);
	(0, import_react.useEffect)(() => {
		const instance = map.current;
		const layer = floodLayer.current;
		if (!ready || !instance || !layer || !isFlood || status !== "done") return;
		if (!instance.hasLayer(layer)) layer.addTo(instance);
		layer.redraw();
	}, [
		status,
		isFlood,
		ready
	]);
	(0, import_react.useEffect)(() => {
		floodLayer.current?.setOpacity(opacity / 100);
	}, [opacity, ready]);
	(0, import_react.useEffect)(() => {
		if (status !== "done") return setToast(false);
		setToast(true);
		const t = setTimeout(() => setToast(false), 6e3);
		return () => clearTimeout(t);
	}, [status]);
	(0, import_react.useEffect)(() => {
		const instance = map.current;
		if (!ready || !instance) return;
		const currentRequest = ++requestId.current;
		const selectedCounty = county.trim();
		const selectedSubCounty = subCounty.trim();
		const selectedWard = ward.trim();
		async function frameSelection() {
			setBoundaryError(null);
			if (isAll(selectedCounty)) {
				if (boundaryLayer.current && instance.hasLayer(boundaryLayer.current)) instance.removeLayer(boundaryLayer.current);
				boundaryLayer.current = null;
				instance.flyTo([KENYA_CENTER.lat, KENYA_CENTER.lon], 6, { duration: .8 });
				setFramed(null);
				return;
			}
			let level = "county";
			if (!isAll(selectedWard)) level = "ward";
			else if (!isAll(selectedSubCounty)) level = "subcounty";
			const params = new URLSearchParams({
				level,
				county: selectedCounty
			});
			if (level === "subcounty" || level === "ward") params.set("subcounty", selectedSubCounty);
			if (level === "ward") params.set("ward", selectedWard);
			try {
				const response = await fetch(`${API_BASE_URL}/locations/boundaries/?${params.toString()}`);
				if (!response.ok) throw new Error(`Boundary request failed with HTTP ${response.status}`);
				const collection = await response.json();
				if (currentRequest !== requestId.current) return;
				if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features) || collection.features.length === 0) throw new Error(`No ${level} boundary was returned for the selected location.`);
				const L = await import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
				if (currentRequest !== requestId.current) return;
				const validFeatures = collection.features.filter((f) => f.geometry !== null);
				if (validFeatures.length === 0) throw new Error("The returned boundary has no valid geometry.");
				const geoJsonLayer = L.geoJSON({
					type: "FeatureCollection",
					features: validFeatures
				}, { style: {
					color: "#0f766e",
					weight: 2.5,
					opacity: 1,
					fillColor: "#14b8a6",
					fillOpacity: .1,
					dashArray: level === "ward" ? "6 4" : void 0
				} });
				const bounds = geoJsonLayer.getBounds();
				if (!bounds.isValid()) throw new Error("The selected boundary has invalid map bounds.");
				if (boundaryLayer.current) instance.removeLayer(boundaryLayer.current);
				boundaryLayer.current = geoJsonLayer;
				geoJsonLayer.addTo(instance);
				instance.flyToBounds(bounds, {
					padding: [36, 36],
					duration: .8,
					maxZoom: level === "ward" ? 13 : level === "subcounty" ? 11 : 10
				});
				setFramed(level === "ward" ? `${selectedWard} Ward` : level === "subcounty" ? `${selectedSubCounty} Sub County` : `${selectedCounty} County`);
			} catch (error) {
				if (currentRequest !== requestId.current) return;
				console.error("Could not frame selected boundary:", error);
				if (level === "county") {
					if (selectedCounty.toLowerCase() === "tana river") {
						instance.flyToBounds(TANA_RIVER_BOUNDS, {
							padding: [36, 36],
							duration: .8
						});
						setFramed(`${selectedCounty} County`);
						return;
					}
					const b = countyBounds(selectedCounty);
					if (b) {
						instance.flyToBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], {
							padding: [36, 36],
							duration: .8
						});
						setFramed(`${selectedCounty} County`);
						return;
					}
				}
				setBoundaryError(error instanceof Error ? error.message : "Unable to load the selected boundary.");
			}
		}
		frameSelection();
		return () => {
			requestId.current += 1;
		};
	}, [
		county,
		subCounty,
		ward,
		ready
	]);
	const statusPill = status === "running" ? {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }),
		text: "Calculating",
		cls: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900"
	} : status === "done" ? {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }),
		text: "Complete",
		cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900"
	} : status === "error" ? {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }),
		text: "Failed",
		cls: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900"
	} : {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-slate-400" }),
		text: "Ready",
		cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref: root,
		className: [
			"mapframe relative flex h-full min-h-[420px] w-full min-w-0 flex-col overflow-hidden",
			"rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10",
			"dark:border-slate-700 dark:bg-slate-950",
			fullscreen ? "rounded-none" : "",
			className
		].join(" "),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: MAP_CSS }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "relative z-[400] flex shrink-0 items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-white via-white to-teal-50/50 px-3 py-3 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-teal-950/30 sm:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md shadow-teal-900/20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base",
							children: framed ?? "Kenya"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplets, { className: "size-3.5 shrink-0 text-teal-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: hazardLabels[hazard]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 sm:inline-flex ${statusPill.cls}`,
						role: "status",
						children: [statusPill.icon, statusPill.text]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: showKenya,
						disabled: framed === null,
						title: `Reset to Kenya (${scaleKm} km scale)`,
						"aria-label": "Reset map to Kenya",
						className: iconBtn,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: toggleFullscreen,
						title: fullscreen ? "Exit full screen" : "Full screen",
						"aria-label": fullscreen ? "Exit full screen" : "Enter full screen",
						className: iconBtn,
						children: fullscreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-h-0 flex-1 bg-slate-100 dark:bg-slate-900",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: holder,
						role: "application",
						"aria-label": framed ? `${hazard} hazard map of ${framed}, Kenya` : `${hazard} hazard map of Kenya`,
						className: "absolute inset-0 size-full"
					}),
					!ready && !failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 z-[300] grid place-items-center bg-slate-100 dark:bg-slate-900",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex animate-pulse items-center gap-2 text-sm text-slate-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-teal-600" }), "Loading map…"]
						})
					}),
					failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 z-[600] grid place-items-center bg-white/95 px-6 text-center backdrop-blur-sm dark:bg-slate-950/95",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-sm rounded-2xl border border-red-100 bg-white p-6 shadow-lg dark:border-red-900 dark:bg-slate-900",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-6" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-4 font-semibold text-slate-900 dark:text-white",
									children: "Map unavailable"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400",
									children: "Map initialization failed. Check that the basemap and GeoServer are reachable, then inspect the browser console."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => window.location.reload(),
									className: "mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Reload map"]
								})
							]
						})
					}),
					boundaryError && !failed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `absolute left-14 right-14 top-3 z-[550] flex items-start gap-3 rounded-xl border-amber-200 p-3 text-sm sm:right-auto sm:max-w-md ${glass}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0 text-amber-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-slate-800 dark:text-slate-100",
								children: "Boundary could not be loaded"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400",
								children: boundaryError
							})]
						})]
					}),
					isFlood && status === "running" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-x-3 bottom-10 z-[500] mx-auto max-w-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center gap-3 rounded-2xl p-3.5 ${glass}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-slate-900 dark:text-white",
										children: "Calculating flood susceptibility"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400",
										children: "Processing environmental indicators and risk classes…"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" })
									})
								]
							})]
						})
					}),
					isFlood && toast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute left-1/2 top-3 z-[500] -translate-x-1/2",
						role: "status",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `flex items-center gap-2 rounded-full py-1.5 pl-2 pr-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 ${glass}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-6 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-950",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" })
							}), "Flood analysis complete · overlay refreshed"]
						})
					}),
					isFlood && status === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `absolute bottom-10 right-3 z-[500] w-[176px] overflow-hidden rounded-2xl sm:w-[200px] ${glass}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setLegendOpen((o) => !o),
							"aria-expanded": legendOpen,
							className: "flex w-full items-center gap-2 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4 text-teal-700 dark:text-teal-400" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 text-xs font-bold text-slate-900 dark:text-white",
									children: "Risk levels"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-4 text-slate-400 transition-transform ${legendOpen ? "" : "-rotate-90"}` })
							]
						}), legendOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-2.5 flex h-2 overflow-hidden rounded-full ring-1 ring-black/10",
									children: RISK_CLASSES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1",
										style: { background: r.color }
									}, r.label))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1.5",
									children: RISK_CLASSES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-3 shrink-0 rounded-sm ring-1 ring-black/10",
											style: { backgroundColor: r.color }
										}), r.label]
									}, r.label))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "mt-3 block border-t border-slate-100 pt-2.5 text-[10px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400",
									children: [
										"Overlay opacity · ",
										opacity,
										"%",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "range",
											min: 10,
											max: 100,
											step: 5,
											value: opacity,
											onChange: (e) => setOpacity(Number(e.currentTarget.value)),
											className: "mt-1.5 h-1.5 w-full cursor-pointer accent-teal-700"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-[9px] leading-4 text-slate-400",
									children: "Legend colors must match the published GeoServer raster style."
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, { className: "size-3.5 shrink-0 text-teal-600" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							ref: coords,
							className: "tabular-nums",
							children: "Move cursor over map"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden text-slate-300 dark:text-slate-700 md:inline",
							children: "|"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden truncate md:inline",
							children: "Leaflet · OpenStreetMap · GeoServer WMS"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: showKenya,
					disabled: framed === null,
					className: "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-950",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-3.5" }), "View all Kenya"]
				})]
			})
		]
	});
}
/**
* Graduated vertical legend: one contiguous colour bar with the class breaks
* labelled alongside, rather than five separated swatches. Contiguous is the
* point — the ramp is a single ordered scale, and gaps between swatches read as
* five unrelated categories.
*
* Class names come from RISK_CLASSES and are deliberately not written here, so
* the GIS team's final terminology is a one-file change in the model.
*/
function MapLegend({ hazard, active }) {
	const label = HAZARDS.find((h) => h.id === hazard)?.label ?? "";
	const descending = [...RISK_CLASSES$1].reverse();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-sm font-semibold tracking-tight",
					children: "Risk key"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": "true",
					className: "w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/10",
					style: { opacity: active ? 1 : .35 },
					children: descending.map((rc) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-9",
						style: { backgroundColor: `var(${rc.varName})` }
					}, rc.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex-1",
					children: descending.map((rc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex h-9 items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-foreground",
							children: rc.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-xs text-muted-foreground",
							children: rc.range
						})]
					}, rc.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 border-t border-border pt-3 text-xs text-muted-foreground",
				children: active ? "Scores are illustrative demo values. The ward table lists them without relying on colour." : "Shading appears once a model run completes."
			})
		]
	});
}
var Sheet = Dialog;
var SheetPortal = DialogPortal;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription.displayName;
function Index() {
	const model = useHazardModel();
	const [controlsOpen, setControlsOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col bg-background xl:h-screen xl:min-h-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {
				county: model.county,
				lastRun: model.lastRun,
				onOpenControls: () => setControlsOpen(true)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 items-stretch xl:min-h-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden w-80 shrink-0 border-r border-chrome-muted lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sticky top-[61px] h-[calc(100vh-61px)] xl:static xl:h-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlSidebar, { model })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
						open: controlsOpen,
						onOpenChange: setControlsOpen,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
							side: "left",
							className: "w-80 border-chrome-muted p-0 lg:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
								className: "sr-only",
								children: "Analysis controls"
							}), controlsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlSidebar, { model })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex min-w-0 flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 xl:pb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_24rem]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapFrame, {
								county: model.county,
								subCounty: model.subCounty,
								ward: model.ward,
								status: model.status,
								hazard: model.hazard,
								className: "xl:h-full"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4 xl:h-full xl:overflow-y-auto xl:pb-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapLegend, {
									hazard: model.hazard,
									active: model.results.length > 0
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WardTable, { results: model.results })]
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { Index as component };
