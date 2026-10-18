import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// Shows the error on screen instead of a blank page
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 24, whiteSpace: "pre-wrap", color: "#b91c1c" }}>
          Something went wrong: {String(this.state.error.message)}
        </pre>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary><App /></ErrorBoundary>
);