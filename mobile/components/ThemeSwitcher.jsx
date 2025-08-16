import React, { useState } from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Example theme objects
export const themes = {
  light: {
    name: "Sunlight",
    background: "#FFF8F3",
    text: "#4A3428",
    accent: "#8B593E",
    inputBg: "#EAF2FF",
    faded: "rgba(74, 52, 40, 0.7)",
    icon: "sunny",
  },
  dark: {
    name: "Moonlight",
    background: "#2D2D2D",
    text: "#F5F5F5",
    accent: "#C97B63",
    inputBg: "#444",
    faded: "rgba(245, 245, 245, 0.7)",
    icon: "moon",
  },
  forest: {
    name: "Forest",
    background: "#E6F4EA",
    text: "#2E4637",
    accent: "#4B7B4B",
    inputBg: "#D9EAD3",
    faded: "rgba(46, 70, 55, 0.7)",
    icon: "leaf",
  },
  purple: {
    name: "Purple",
    background: "#F3E6FF",
    text: "#4B2E63",
    accent: "#8B59A3",
    inputBg: "#EAD3F7",
    faded: "rgba(75, 46, 99, 0.7)",
    icon: "color-palette",
  },
};

// ThemeSwitcher is disabled
export default function ThemeSwitcher() {
  return;
}