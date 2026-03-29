"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ChartColors {
  grid: string;
  axis: string;
  tooltipBorder: string;
  tooltipBg: string;
  pieStroke: string;
}

const LIGHT: ChartColors = {
  grid: "#E8E4E0",
  axis: "#737373",
  tooltipBorder: "#E8E4E0",
  tooltipBg: "#FFFFFF",
  pieStroke: "#FFFFFF",
};

const DARK: ChartColors = {
  grid: "#2E2E2E",
  axis: "#A3A3A3",
  tooltipBorder: "#2E2E2E",
  tooltipBg: "#171717",
  pieStroke: "#171717",
};

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(LIGHT);

  useEffect(() => {
    setColors(resolvedTheme === "dark" ? DARK : LIGHT);
  }, [resolvedTheme]);

  return colors;
}
