import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime, u as Slot } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { A as Download, B as ArrowUp, D as FileDown, F as ChevronUp, H as ArrowDown, L as ChevronDown, R as Check, S as Inbox, U as Activity, V as ArrowUpDown, _ as MapPinned, b as LayoutDashboard, c as ShieldAlert, i as TrendingUp, l as Search, m as Menu, n as Waves, s as ShieldCheck, t as X, w as Gauge } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Label$1 } from "../_libs/radix-ui__react-label.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-hazard-model-C22Zx3xd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function AppHeader({ county, lastRun, onOpenControls }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-30 border-b border-white/10 text-white shadow-md",
		style: { backgroundColor: "#0a1f44" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6",
			children: [
				onOpenControls && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onOpenControls,
					"aria-label": "Open controls",
					className: "text-white hover:bg-white/10 hover:text-white lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-9 place-items-center rounded-md border border-white/15 bg-white/10 text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "leading-tight",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-base font-semibold tracking-tight text-white sm:text-lg",
							children: "Sentinel Hazard Monitor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-white/65",
							children: [
								"Regional early-warning console · ",
								county,
								" County"
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "ml-auto flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeaderLink, {
						to: "/",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { className: "size-4" }),
						label: "Dashboard"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeaderLink, {
						to: "/reports",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileDown, { className: "size-4" }),
						label: "Reports"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden items-center gap-4 border-l border-white/15 pl-4 text-xs text-white/65 xl:flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Last run:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-white",
							children: lastRun ? lastRun.toLocaleTimeString() : "—"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Source: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-white",
						children: "Demo dataset v1"
					})] })]
				})
			]
		})
	});
}
function HeaderLink({ to, icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		activeOptions: { exact: to === "/" },
		className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white",
		activeProps: { className: "bg-white/15 !text-white" },
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: label
		})]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Label$1.displayName;
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
/**
* Legacy frontend parameter definitions.
*
* Flood analysis is now supplied by the real Django/GIS backend.
* These definitions remain temporarily for the other hazard screens
* until their GIS calculation APIs are connected.
*/
var PARAMETERS = [
	{
		id: "gradient",
		label: "Gradient",
		unit: "%",
		min: 0,
		max: 60,
		step: 1,
		default: 12
	},
	{
		id: "rainfall",
		label: "Rainfall",
		unit: "mm",
		min: 0,
		max: 400,
		step: 5,
		default: 120
	},
	{
		id: "temperature",
		label: "Temperature",
		unit: "Â°C",
		min: 5,
		max: 45,
		step: 1,
		default: 24
	},
	{
		id: "humidity",
		label: "Humidity",
		unit: "%",
		min: 0,
		max: 100,
		step: 1,
		default: 62
	}
];
var HAZARDS = [
	{
		id: "flood",
		label: "Flood",
		blurb: "Surface water accumulation"
	},
	{
		id: "drought",
		label: "Drought",
		blurb: "Prolonged moisture deficit"
	},
	{
		id: "landslide",
		label: "Landslide",
		blurb: "Slope mass movement"
	}
];
/**
* GIS hazard classification.
*
* These labels match the flood hotspot classification produced
* by the backend/GIS calculation:
*
* 1 = Very Low
* 2 = Low
* 3 = Moderate
* 4 = High
* 5 = Very High
*/
var RISK_CLASSES = [
	{
		id: "very-low",
		label: "Very Low",
		range: "",
		varName: "--risk-1"
	},
	{
		id: "low",
		label: "Low",
		range: "",
		varName: "--risk-2"
	},
	{
		id: "moderate",
		label: "Moderate",
		range: "",
		varName: "--risk-3"
	},
	{
		id: "high",
		label: "High",
		range: "",
		varName: "--risk-4"
	},
	{
		id: "very-high",
		label: "Very High",
		range: "",
		varName: "--risk-5"
	}
];
/**
* Convert the backend/GIS class number into the frontend legend class.
*/
function riskClassForClass(classNumber) {
	if (classNumber <= 1) return RISK_CLASSES[0];
	if (classNumber === 2) return RISK_CLASSES[1];
	if (classNumber === 3) return RISK_CLASSES[2];
	if (classNumber === 4) return RISK_CLASSES[3];
	return RISK_CLASSES[4];
}
var COUNTIES = [
	{
		name: "Nairobi",
		subCounties: [
			{
				name: "Westlands",
				wards: [
					"Kitisuru",
					"Parklands",
					"Karura",
					"Kangemi"
				]
			},
			{
				name: "Embakasi East",
				wards: [
					"Upper Savannah",
					"Utawala",
					"Mihango"
				]
			},
			{
				name: "Kasarani",
				wards: [
					"Mwiki",
					"Kahawa",
					"Roysambu",
					"Njiru"
				]
			}
		]
	},
	{
		name: "Kisumu",
		subCounties: [
			{
				name: "Kisumu Central",
				wards: [
					"Railways",
					"Migosi",
					"Shaurimoyo",
					"Market Milimani"
				]
			},
			{
				name: "Nyando",
				wards: [
					"Ahero",
					"Kabonyo",
					"Awasi",
					"East Kano"
				]
			},
			{
				name: "Muhoroni",
				wards: [
					"Chemelil",
					"Miwani",
					"Ombeyi"
				]
			}
		]
	},
	{
		name: "Baringo",
		subCounties: [
			{
				name: "Baringo North",
				wards: [
					"Barwessa",
					"Kabartonjo",
					"Saimo Soi"
				]
			},
			{
				name: "Marigat",
				wards: [
					"Ilchamus",
					"Mochongoi",
					"Marigat"
				]
			},
			{
				name: "Tiaty",
				wards: [
					"Ribkwo",
					"Silale",
					"Loiyamorok",
					"Tirioko"
				]
			}
		]
	},
	{
		name: "Murang'a",
		subCounties: [
			{
				name: "Kangema",
				wards: [
					"Kanyenya-ini",
					"Muguru",
					"Rwathia"
				]
			},
			{
				name: "Mathioya",
				wards: [
					"Gitugi",
					"Kiru",
					"Kamacharia"
				]
			},
			{
				name: "Kandara",
				wards: [
					"Ng'araria",
					"Muruka",
					"Gaichanjiru",
					"Ithiru"
				]
			}
		]
	}
];
var DEFAULT_PARAMETERS = {
	gradient: 12,
	rainfall: 120,
	temperature: 24,
	humidity: 62
};
/**
* Parameters currently exposed by the frontend.
*
* These are retained for drought/landslide placeholder screens.
* Flood does not use them because its weights and inputs are supplied
* by the real GIS backend.
*/
function applicableParameters(hazard) {
	switch (hazard) {
		case "flood": return [];
		case "drought": return [
			"rainfall",
			"temperature",
			"humidity"
		];
		case "landslide": return [
			"gradient",
			"rainfall",
			"humidity"
		];
		default: return [];
	}
}
/**
* Temporary placeholder for non-flood screens.
*
* This is deliberately not used by the real flood analysis.
* Once drought and landslide APIs are connected, this function
* will be removed together with the remaining demo model code.
*/
function runModel(county, _hazard, _parameters, _selected, _scope) {
	return [{
		id: `${county}-pending-gis`,
		name: "GIS results pending",
		subCounty: "",
		county,
		score: 0,
		risk: RISK_CLASSES[0]
	}];
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-slate-200 bg-white",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-0.5 w-full",
				style: { backgroundColor: "#0a1f44" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-8 shrink-0 place-items-center rounded-md text-white",
							style: { backgroundColor: "#0a1f44" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "leading-tight",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-tight text-slate-900",
								children: "Sentinel Hazard Monitor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-[10px] text-slate-500",
								children: "Regional Disaster Risk Unit"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 lg:max-w-lg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "size-4 shrink-0 text-amber-700" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] leading-relaxed text-amber-900 sm:text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: "Demo notice:"
								}),
								" ",
								"Figures are illustrative and must not be used for operational decisions."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500 sm:text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "transition-colors hover:text-slate-900",
								children: "Methodology"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "transition-colors hover:text-slate-900",
								children: "Data policy"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "transition-colors hover:text-slate-900",
								children: "Contact"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-slate-100 bg-slate-50 px-4 py-1.5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-[10px] text-slate-400",
					children: "Sentinel Hazard Monitor · For demonstration and assessment purposes"
				})
			})
		]
	});
}
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
var NAVY = "#0a1f44";
var FLOOD_CLASSES = [
	{
		key: "veryLow",
		label: "Very Low",
		color: "#16a34a"
	},
	{
		key: "low",
		label: "Low",
		color: "#84cc16"
	},
	{
		key: "moderate",
		label: "Moderate",
		color: "#eab308"
	},
	{
		key: "high",
		label: "High",
		color: "#f97316"
	},
	{
		key: "veryHigh",
		label: "Very High",
		color: "#dc2626"
	}
];
var num = (value) => typeof value === "number" && Number.isFinite(value);
var AVATARS = [
	"#0f766e",
	"#047857",
	"#0e7490",
	"#0369a1",
	"#4338ca",
	"#6d28d9"
];
var avatarColor = (name) => AVATARS[[...name].reduce((total, char) => total + char.charCodeAt(0), 0) % AVATARS.length];
function riskColor(label, fallback) {
	const normalized = label.toLowerCase().trim();
	const match = FLOOD_CLASSES.find((item) => item.label.toLowerCase() === normalized);
	if (match) return match.color;
	if (normalized.includes("very high")) return "#dc2626";
	if (normalized.includes("high")) return "#f97316";
	if (normalized.includes("moderate") || normalized.includes("medium")) return "#eab308";
	if (normalized.includes("very low")) return "#16a34a";
	if (normalized.includes("low")) return "#84cc16";
	if (fallback && /^--[\w-]+$/.test(fallback)) return `var(${fallback})`;
	return "#64748b";
}
function riskOrder(label) {
	const normalized = label.toLowerCase();
	if (normalized.includes("very low")) return 0;
	if (normalized === "low" || normalized.endsWith(" low")) return 1;
	if (normalized.includes("moderate") || normalized.includes("medium")) return 2;
	if (normalized === "high" || normalized.endsWith(" high")) return 3;
	if (normalized.includes("very high")) return 4;
	return 5;
}
function csvEscape(value) {
	return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}
function WardTable({ results }) {
	const [sort, setSort] = (0, import_react.useState)("score");
	const [desc, setDesc] = (0, import_react.useState)(true);
	const [query, setQuery] = (0, import_react.useState)("");
	const [riskFilter, setRiskFilter] = (0, import_react.useState)(null);
	const all = results;
	const riskLevels = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		all.forEach((ward) => {
			const existing = map.get(ward.risk.label);
			if (existing) existing.count += 1;
			else map.set(ward.risk.label, {
				label: ward.risk.label,
				varName: ward.risk.varName,
				count: 1
			});
		});
		return [...map.values()].sort((a, b) => riskOrder(a.label) - riskOrder(b.label) || a.label.localeCompare(b.label));
	}, [all]);
	const maxScore = (0, import_react.useMemo)(() => Math.max(1, ...all.map((ward) => ward.score)), [all]);
	const avgScore = all.length ? all.reduce((sum, ward) => sum + ward.score, 0) / all.length : 0;
	const topWard = (0, import_react.useMemo)(() => [...all].sort((a, b) => b.score - a.score)[0], [all]);
	const totalArea = all.reduce((sum, ward) => sum + (ward.flood?.affectedAreaKm2 ?? 0), 0);
	const rows = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		const direction = desc ? -1 : 1;
		return all.filter((ward) => (!riskFilter || ward.risk.label === riskFilter) && (!q || ward.name.toLowerCase().includes(q) || ward.subCounty.toLowerCase().includes(q))).sort((a, b) => {
			if (sort === "score") return (a.score - b.score) * direction;
			if (sort === "area") return ((a.flood?.affectedAreaKm2 ?? 0) - (b.flood?.affectedAreaKm2 ?? 0)) * direction;
			return a[sort].localeCompare(b[sort]) * direction;
		});
	}, [
		all,
		sort,
		desc,
		query,
		riskFilter
	]);
	function toggle(key) {
		if (key === sort) {
			setDesc((current) => !current);
			return;
		}
		setSort(key);
		setDesc(key === "score" || key === "area");
	}
	function exportCsv() {
		const header = [
			"ward",
			"sub_county",
			"score",
			"risk",
			...FLOOD_CLASSES.map((item) => `${item.key}_pct`),
			"affected_km2"
		];
		const lines = rows.map((ward) => [
			csvEscape(ward.name),
			csvEscape(ward.subCounty),
			ward.score,
			csvEscape(ward.risk.label),
			...FLOOD_CLASSES.map((item) => ward.flood?.[item.key] ?? ""),
			ward.flood?.affectedAreaKm2 ?? ""
		].join(","));
		const blob = new Blob(["﻿", [header.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "sentinel-ward-results.csv";
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
	}
	const clearFilters = () => {
		setQuery("");
		setRiskFilter(null);
	};
	if (results.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 overflow-hidden border border-slate-200 bg-white shadow-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5",
			style: { backgroundColor: NAVY },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinned, { className: "size-5 shrink-0 text-emerald-300" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold tracking-tight",
				children: "Ward results"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-white/65",
				children: "Susceptibility analysis by administrative area"
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center px-5 py-9 text-center sm:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-12 place-items-center bg-slate-100 text-slate-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, { className: "size-6" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "mt-4 text-sm font-semibold text-slate-900",
					children: "No ward results available"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-sm text-xs leading-5 text-slate-500",
					children: "Run a hazard calculation to populate this table with ward susceptibility scores, risk classifications, and affected-area statistics."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex w-full max-w-xs flex-col gap-1.5 text-left",
					"aria-label": "Flood risk legend",
					children: FLOOD_CLASSES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 border border-slate-100 px-2 py-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "h-4 w-1 shrink-0",
							style: { backgroundColor: item.color }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-medium text-slate-600",
							children: item.label
						})]
					}, item.key))
				})
			]
		})]
	});
	const stats = [
		{
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinned, { className: "size-4" }),
			label: "Total wards",
			value: String(all.length),
			note: "In current results"
		},
		{
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4" }),
			label: "Highest score",
			value: topWard ? String(topWard.score) : "—",
			note: topWard?.name ?? "No ward"
		},
		{
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4" }),
			label: "Average score",
			value: avgScore.toFixed(1),
			note: "Across all wards"
		},
		{
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-4" }),
			label: "Affected area",
			value: totalArea ? `${totalArea.toLocaleString(void 0, { maximumFractionDigits: 1 })} km²` : "—",
			note: "Combined reported area"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "min-w-0 overflow-hidden border border-slate-200 bg-white shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white sm:px-5",
				style: { backgroundColor: NAVY },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-9 shrink-0 place-items-center border border-white/15 bg-white/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinned, { className: "size-4 text-emerald-300" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold tracking-tight",
							children: "Ward susceptibility results"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-[11px] text-white/65",
							children: "Risk classification and affected-area distribution"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: exportCsv,
					className: "inline-flex h-8 items-center gap-2 border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Export CSV"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 border-b border-slate-200 bg-white lg:grid-cols-4",
				children: stats.map((stat, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `min-w-0 bg-white px-3 py-3 sm:px-4 ${index < 2 ? "border-b border-slate-200 lg:border-b-0" : ""} ${index % 2 === 0 ? "border-r border-slate-200" : ""} ${index === 2 ? "lg:border-l lg:border-r lg:border-slate-200" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-teal-700",
								children: stat.icon
							}), stat.label]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl",
							children: stat.value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-[10px] text-slate-500",
							children: stat.note
						})
					]
				}, stat.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 border-b border-slate-200 px-3 py-3 sm:px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative min-w-[180px] flex-1 sm:max-w-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: "Search ward or sub-county...",
									"aria-label": "Search wards",
									className: "h-9 w-full border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
								}),
								query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Clear search",
									onClick: () => setQuery(""),
									className: "absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-slate-500",
							children: [
								rows.length,
								" matching ",
								rows.length === 1 ? "ward" : "wards"
							]
						}),
						(query || riskFilter) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: clearFilters,
							className: "inline-flex h-8 items-center gap-1 px-2 text-xs font-medium text-teal-800 hover:bg-teal-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), "Clear filters"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "col-span-full mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500",
							children: "Filter by risk class"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setRiskFilter(null),
							"aria-pressed": !riskFilter,
							className: `flex min-h-8 items-center justify-between gap-2 border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${!riskFilter ? "border-[#0a1f44] bg-[#0a1f44] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All wards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums opacity-70",
								children: all.length
							})]
						}),
						riskLevels.map((level) => {
							const selected = riskFilter === level.label;
							const color = riskColor(level.label, level.varName);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setRiskFilter(selected ? null : level.label),
								"aria-pressed": selected,
								className: `flex min-h-8 items-center justify-between gap-2 border px-2.5 py-1.5 text-left text-[11px] transition ${selected ? "bg-slate-50 font-bold" : "border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50"}`,
								style: selected ? {
									color,
									borderColor: color
								} : void 0,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex min-w-0 items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-4 w-1 shrink-0",
										style: { backgroundColor: color }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: level.label
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 tabular-nums text-slate-400",
									children: level.count
								})]
							}, level.label);
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-[min(65vh,36rem)] overflow-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
					className: "sticky top-0 z-20 text-white",
					style: { backgroundColor: NAVY },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "border-white/10 hover:bg-transparent",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "w-10 text-center text-[10px] font-semibold text-white/65",
								children: "#"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Ward",
								col: "name",
								sort,
								desc,
								onSort: toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Sub-county",
								col: "subCounty",
								sort,
								desc,
								onSort: toggle
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Score",
								col: "score",
								sort,
								desc,
								onSort: toggle,
								className: "min-w-[125px]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "whitespace-nowrap text-[11px] font-semibold text-white",
								children: "Risk class"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "min-w-[130px] text-[11px] font-semibold text-white",
								children: "Distribution"
							}),
							FLOOD_CLASSES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "whitespace-nowrap text-right text-[10px] font-semibold text-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 px-1.5 py-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "size-1.5 shrink-0",
										style: { backgroundColor: item.color }
									}), item.label]
								})
							}, item.key)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortHeader, {
								label: "Affected km²",
								col: "area",
								sort,
								desc,
								onSort: toggle,
								className: "text-right"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, {
					className: "hover:bg-transparent",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
						colSpan: 12,
						className: "py-12 text-center text-sm text-slate-500",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mx-auto mb-2 size-5 text-slate-300" }),
							"No wards match your current filters.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-1 font-semibold text-teal-800 hover:underline",
								onClick: clearFilters,
								children: "Clear filters"
							})
						]
					})
				}), rows.map((ward, index) => {
					const flood = ward.flood;
					const color = riskColor(ward.risk.label, ward.risk.varName);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "group border-slate-100 transition-colors hover:bg-slate-50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-center text-[11px] tabular-nums text-slate-400",
								children: index + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-7 shrink-0 place-items-center text-[11px] font-bold text-white",
									style: { backgroundColor: avatarColor(ward.name) },
									children: ward.name.charAt(0).toUpperCase()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-semibold text-slate-800",
									children: ward.name
								})]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "whitespace-nowrap text-xs text-slate-500",
								children: ward.subCounty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-1.5 w-16 shrink-0 overflow-hidden bg-slate-100",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full transition-all",
										style: {
											width: `${Math.min(100, Math.max(0, ward.score / maxScore * 100))}%`,
											backgroundColor: color
										}
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold tabular-nums text-slate-800",
									children: ward.score
								})]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 whitespace-nowrap border-l-2 px-2 py-1 text-[10px] font-semibold",
								style: {
									color,
									borderLeftColor: color,
									backgroundColor: `color-mix(in srgb, ${color} 9%, white)`
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-1.5 shrink-0",
									style: { backgroundColor: color }
								}), ward.risk.label]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: flood ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-2 overflow-hidden bg-slate-100",
								role: "img",
								"aria-label": FLOOD_CLASSES.map((item) => `${item.label} ${flood[item.key] ?? 0}%`).join(", "),
								children: FLOOD_CLASSES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									title: `${item.label}: ${(flood[item.key] ?? 0).toFixed(2)}%`,
									style: {
										width: `${Math.max(0, flood[item.key] ?? 0)}%`,
										backgroundColor: item.color
									}
								}, item.key))
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-slate-400",
								children: "—"
							}) }),
							FLOOD_CLASSES.map((item) => {
								const value = flood?.[item.key];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "p-1 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block px-1.5 py-1.5 text-[11px] tabular-nums",
										style: num(value) && value > 0 ? {
											backgroundColor: `color-mix(in srgb, ${item.color} ${Math.min(45, value * .5)}%, white)`,
											color: item.key === "low" && value > 15 ? "#365314" : "#334155",
											fontWeight: value >= 30 ? 700 : 500
										} : { color: "#94a3b8" },
										children: num(value) ? `${value.toFixed(1)}%` : "—"
									})
								}, item.key);
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "whitespace-nowrap text-right text-xs font-semibold tabular-nums text-slate-700",
								children: num(flood?.affectedAreaKm2) ? flood.affectedAreaKm2.toLocaleString(void 0, { maximumFractionDigits: 2 }) : "—"
							})
						]
					}, ward.id);
				})] })] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 sm:px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[11px] text-slate-500",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3.5 text-teal-700" }),
						"Showing",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-slate-800",
							children: rows.length
						}),
						" of",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-slate-800",
							children: all.length
						}),
						" wards"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-slate-400",
					children: "Cell shading represents each risk class's share of the ward."
				})]
			})
		]
	});
}
function SortHeader({ label, col, sort, desc, onSort, className = "" }) {
	const active = sort === col;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
		className,
		"aria-sort": active ? desc ? "descending" : "ascending" : "none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onSort(col),
			className: `inline-flex items-center gap-1 whitespace-nowrap px-1 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${active ? "text-emerald-300" : "text-white hover:bg-white/10 hover:text-white"}`,
			children: [label, active ? desc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "size-3 opacity-45" })]
		})
	});
}
var FLOOD_API_URL = "http://127.0.0.1:8000/api/calculations/flood/";
async function getFloodAnalysis(weights) {
	const response = await fetch(FLOOD_API_URL, {
		method: weights ? "POST" : "GET",
		headers: {
			Accept: "application/json",
			...weights ? { "Content-Type": "application/json" } : {}
		},
		...weights ? { body: JSON.stringify({ weights }) } : {}
	});
	const responseText = await response.text();
	let data;
	try {
		data = JSON.parse(responseText);
	} catch {
		throw new Error(`Flood API returned a non-JSON response (HTTP ${response.status}). ` + responseText.slice(0, 500));
	}
	if (!response.ok) throw new Error(data.details || data.error || `Flood API request failed with status ${response.status}.`);
	if (!data.success || !data.calculation) throw new Error(data.details || data.error || "The flood API did not return a successful calculation.");
	return data;
}
var DJANGO_API_URL = "http://127.0.0.1:8000";
/**
* The calculator stores and displays percentages.
* These defaults total exactly 100%.
*/
var DEFAULT_FLOOD_WEIGHTS = {
	dist_to_river: 58.33,
	rainfall: 33.33,
	landcover: 8.34
};
var FLOOD_WEIGHT_TOLERANCE = .01;
async function fetchLocationItems(url, signal) {
	const response = await fetch(url, {
		method: "GET",
		headers: { Accept: "application/json" },
		signal
	});
	const responseText = await response.text();
	let data;
	try {
		data = JSON.parse(responseText);
	} catch {
		throw new Error(`Location API returned a non-JSON response (HTTP ${response.status}). ` + responseText.slice(0, 300));
	}
	if (!response.ok) throw new Error(data.details || data.error || `Location request failed with status ${response.status}.`);
	if (!Array.isArray(data.results)) throw new Error("The location API returned an invalid response.");
	return data.results;
}
function getErrorMessage(error, fallback) {
	return error instanceof Error ? error.message : fallback;
}
function useHazardModel() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [counties, setCounties] = (0, import_react.useState)([]);
	const [countiesLoading, setCountiesLoading] = (0, import_react.useState)(true);
	const [countiesError, setCountiesError] = (0, import_react.useState)(null);
	const [county, setCounty] = (0, import_react.useState)("");
	const [subCounty, setSubCounty] = (0, import_react.useState)("all");
	const [ward, setWard] = (0, import_react.useState)("all");
	const [subCountyItems, setSubCountyItems] = (0, import_react.useState)([]);
	const [wardItems, setWardItems] = (0, import_react.useState)([]);
	const [subCountiesLoading, setSubCountiesLoading] = (0, import_react.useState)(false);
	const [wardsLoading, setWardsLoading] = (0, import_react.useState)(false);
	const [subCountiesError, setSubCountiesError] = (0, import_react.useState)(null);
	const [wardsError, setWardsError] = (0, import_react.useState)(null);
	const [hazard, setHazardState] = (0, import_react.useState)("flood");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [parameters, setParameters] = (0, import_react.useState)(DEFAULT_PARAMETERS);
	const [floodWeights, setFloodWeights] = (0, import_react.useState)({ ...DEFAULT_FLOOD_WEIGHTS });
	const [status, setStatus] = (0, import_react.useState)("idle");
	const [results, setResults] = (0, import_react.useState)([]);
	const [lastRun, setLastRun] = (0, import_react.useState)(null);
	const [floodCalculation, setFloodCalculation] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		async function loadCounties() {
			setCountiesLoading(true);
			setCountiesError(null);
			try {
				const items = await fetchLocationItems(`${DJANGO_API_URL}/api/locations/counties/`, controller.signal);
				const unique = /* @__PURE__ */ new Map();
				for (const item of items) {
					const name = typeof item.name === "string" ? item.name.trim() : "";
					if (!name || unique.has(name)) continue;
					unique.set(name, {
						name,
						properties: {
							id: item.id,
							code: item.code,
							COUNTY: name
						}
					});
				}
				const loadedCounties = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
				if (controller.signal.aborted) return;
				setCounties(loadedCounties);
				setCounty((current) => {
					if (current && loadedCounties.some((item) => item.name === current)) return current;
					return loadedCounties[0]?.name ?? "";
				});
			} catch (err) {
				if (controller.signal.aborted) return;
				setCounties([]);
				setCounty("");
				setCountiesError(getErrorMessage(err, "Unable to load counties from the backend."));
			} finally {
				if (!controller.signal.aborted) setCountiesLoading(false);
			}
		}
		loadCounties();
		return () => controller.abort();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!county) {
			setSubCountyItems([]);
			setWardItems([]);
			setSubCountiesError(null);
			setWardsError(null);
			setSubCountiesLoading(false);
			setWardsLoading(false);
			return;
		}
		const controller = new AbortController();
		const countyQuery = encodeURIComponent(county);
		async function loadSubCounties() {
			setSubCountiesLoading(true);
			setSubCountiesError(null);
			setSubCountyItems([]);
			try {
				const items = await fetchLocationItems(`${DJANGO_API_URL}/api/locations/subcounties/?county=${countyQuery}`, controller.signal);
				if (controller.signal.aborted) return;
				const unique = /* @__PURE__ */ new Map();
				for (const item of items) {
					const name = item.name?.trim();
					if (!name || unique.has(name)) continue;
					unique.set(name, {
						...item,
						name
					});
				}
				setSubCountyItems([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
			} catch (err) {
				if (controller.signal.aborted) return;
				setSubCountyItems([]);
				setSubCounty("all");
				setSubCountiesError(getErrorMessage(err, "Unable to load sub-counties."));
			} finally {
				if (!controller.signal.aborted) setSubCountiesLoading(false);
			}
		}
		async function loadWards() {
			setWardsLoading(true);
			setWardsError(null);
			setWardItems([]);
			try {
				const items = await fetchLocationItems(`${DJANGO_API_URL}/api/locations/wards/?county=${countyQuery}`, controller.signal);
				if (controller.signal.aborted) return;
				const unique = /* @__PURE__ */ new Map();
				for (const item of items) {
					const name = item.name?.trim();
					if (!name || unique.has(name)) continue;
					unique.set(name, {
						...item,
						name
					});
				}
				setWardItems([...unique.values()].sort((a, b) => a.name.localeCompare(b.name)));
			} catch (err) {
				if (controller.signal.aborted) return;
				setWardItems([]);
				setWard("all");
				setWardsError(getErrorMessage(err, "Unable to load wards."));
			} finally {
				if (!controller.signal.aborted) setWardsLoading(false);
			}
		}
		loadSubCounties();
		loadWards();
		return () => controller.abort();
	}, [county]);
	const filteredCounties = (0, import_react.useMemo)(() => {
		const value = query.trim().toLowerCase();
		if (!value) return counties;
		return counties.filter((item) => item.name.toLowerCase().includes(value));
	}, [counties, query]);
	const subCounties = (0, import_react.useMemo)(() => subCountyItems.map((item) => item.name), [subCountyItems]);
	const wards = (0, import_react.useMemo)(() => wardItems.map((item) => item.name), [wardItems]);
	const applicable = (0, import_react.useMemo)(() => applicableParameters(hazard), [hazard]);
	const activeCriteria = (0, import_react.useMemo)(() => selected.filter((id) => applicable.includes(id)), [selected, applicable]);
	const ignoredCriteria = (0, import_react.useMemo)(() => selected.filter((id) => !applicable.includes(id)), [selected, applicable]);
	const floodWeightsTotal = floodWeights.dist_to_river + floodWeights.rainfall + floodWeights.landcover;
	const floodWeightsValid = Object.values(floodWeights).every((value) => Number.isFinite(value) && value >= 0 && value <= 100) && Math.abs(floodWeightsTotal - 100) <= FLOOD_WEIGHT_TOLERANCE;
	const canRun = status !== "running" && (hazard === "flood" ? floodWeightsValid : Boolean(county) && activeCriteria.length > 0);
	const usesDefaults = (0, import_react.useMemo)(() => selected.every((id) => parameters[id] === DEFAULT_PARAMETERS[id]), [selected, parameters]);
	return {
		query,
		setQuery,
		counties,
		filteredCounties,
		countiesLoading,
		countiesError,
		county,
		selectCounty: (0, import_react.useCallback)((name) => {
			setCounty(name);
			setSubCounty("all");
			setWard("all");
			setSubCountyItems([]);
			setWardItems([]);
			setFloodCalculation(null);
			setResults([]);
			setLastRun(null);
			setStatus("idle");
			setError(null);
		}, []),
		subCounty,
		selectSubCounty: (0, import_react.useCallback)((name) => {
			setSubCounty(name);
			setWard("all");
		}, []),
		subCounties,
		subCountiesLoading,
		subCountiesError,
		ward,
		setWard,
		wards,
		wardsLoading,
		wardsError,
		hazard,
		setHazard: (0, import_react.useCallback)((nextHazard) => {
			setHazardState(nextHazard);
			setFloodCalculation(null);
			setResults([]);
			setLastRun(null);
			setStatus("idle");
			setError(null);
		}, []),
		selected,
		toggleParameter: (0, import_react.useCallback)((id) => {
			setSelected((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
			setParameters((values) => ({
				...values,
				[id]: DEFAULT_PARAMETERS[id]
			}));
		}, []),
		applicable,
		activeCriteria,
		ignoredCriteria,
		canRun,
		usesDefaults,
		parameters,
		setParameter: (0, import_react.useCallback)((id, value) => {
			setParameters((previous) => ({
				...previous,
				[id]: value
			}));
		}, []),
		resetParameters: (0, import_react.useCallback)(() => {
			setParameters(DEFAULT_PARAMETERS);
		}, []),
		clearParameters: (0, import_react.useCallback)(() => {
			setSelected([]);
			setParameters(DEFAULT_PARAMETERS);
		}, []),
		floodWeights,
		setFloodWeight: (0, import_react.useCallback)((key, value) => {
			if (!Number.isFinite(value)) return;
			const safeValue = Math.min(100, Math.max(0, value));
			setFloodWeights((previous) => ({
				...previous,
				[key]: safeValue
			}));
			setFloodCalculation(null);
			setResults([]);
			setLastRun(null);
			setStatus("idle");
			setError(null);
		}, []),
		resetFloodWeights: (0, import_react.useCallback)(() => {
			setFloodWeights({ ...DEFAULT_FLOOD_WEIGHTS });
			setFloodCalculation(null);
			setResults([]);
			setLastRun(null);
			setStatus("idle");
			setError(null);
		}, []),
		floodWeightsTotal,
		floodWeightsValid,
		status,
		results,
		lastRun,
		floodCalculation,
		error,
		run: (0, import_react.useCallback)(async () => {
			if (status === "running") return;
			if (hazard === "flood" && !floodWeightsValid) {
				setError(`Flood weights must total 100%. Current total: ${floodWeightsTotal.toFixed(2)}%.`);
				setStatus("error");
				return;
			}
			if (hazard !== "flood" && (!county || activeCriteria.length === 0)) {
				setError("Select a county and at least one applicable criterion before running.");
				setStatus("error");
				return;
			}
			setStatus("running");
			setError(null);
			setFloodCalculation(null);
			setResults([]);
			if (hazard === "flood") {
				try {
					const response = await getFloodAnalysis({
						dist_to_river: floodWeights.dist_to_river / 100,
						rainfall: floodWeights.rainfall / 100,
						landcover: floodWeights.landcover / 100
					});
					if (!response.success || !response.calculation) throw new Error([response.error, response.details].filter(Boolean).join(": ") || "The flood GIS backend did not return a successful calculation.");
					const wardResults = response.calculation.wards.map((ward) => ({
						id: ward.id,
						name: ward.name,
						subCounty: ward.subCounty,
						county: ward.county,
						score: ward.score,
						risk: riskClassForClass(ward.riskClass),
						flood: ward.flood
					}));
					setResults(wardResults);
					setFloodCalculation(response.calculation);
					setLastRun(/* @__PURE__ */ new Date());
					setStatus("done");
				} catch (err) {
					setFloodCalculation(null);
					setLastRun(null);
					setStatus("error");
					setError(getErrorMessage(err, "Unable to connect to the flood GIS API."));
				}
				return;
			}
			try {
				const criteria = [...activeCriteria];
				const modelResults = runModel(county, hazard, parameters, criteria, {
					...subCounty && subCounty !== "all" ? { subCounty } : {},
					...ward && ward !== "all" ? { ward } : {}
				});
				setResults(modelResults);
				setLastRun(/* @__PURE__ */ new Date());
				setStatus("done");
			} catch (err) {
				setStatus("error");
				setError(getErrorMessage(err, "The hazard analysis could not be completed."));
			}
		}, [
			status,
			hazard,
			floodWeights,
			floodWeightsValid,
			floodWeightsTotal,
			county,
			activeCriteria,
			parameters,
			subCounty,
			ward
		])
	};
}
//#endregion
export { cn as C, applicableParameters as S, useHazardModel as T, TableCell as _, Input as a, TableRow as b, RISK_CLASSES as c, SelectItem as d, SelectTrigger as f, TableBody as g, Table as h, HAZARDS as i, Select as l, SiteFooter as m, Button as n, Label as o, SelectValue as p, COUNTIES as r, PARAMETERS as s, AppHeader as t, SelectContent as u, TableHead as v, runModel as w, WardTable as x, TableHeader as y };
