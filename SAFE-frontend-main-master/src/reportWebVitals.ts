import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

// Definito il ReportHandler localmente
interface Metric {
  name: "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
  id: string;
  value: number;
  delta: number;
}
type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};
   export default reportWebVitals;