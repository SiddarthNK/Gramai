import React from 'react';

const formatText = (rawText) => {
  if (!rawText) return [];
  const lines = rawText.split("\n");
  const elements = [];
  let currentList = [];
  let key = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={key++}
          style={{
            margin: "8px 0",
            paddingLeft: "0",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {currentList.map((item, i) => (
            <li
              key={i}
              style={{
                fontSize: "14px",
                lineHeight: "1.7",
                color: "var(--color-text-secondary)",
                listStyleType: "none",
                paddingLeft: "12px",
                borderLeft: "2px solid #22c55e",
                marginLeft: "0"
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={key++} style={{ height: "6px" }} />);
      return;
    }

    // Heading lines starting with ** or # or ## or ending with :
    if (
      trimmed.startsWith("##") ||
      trimmed.startsWith("#") ||
      (trimmed.startsWith("**") && (trimmed.endsWith("**") || trimmed.endsWith(":**"))) ||
      trimmed.endsWith(":")
    ) {
      flushList();
      const headingText = trimmed
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/:$/, "");

      elements.push(
        <p
          key={key++}
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "#22c55e",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            margin: "14px 0 6px 0"
          }}
        >
          {headingText}
        </p>
      );
      return;
    }

    // Bullet lines starting with - * • or numbers
    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("• ") ||
      /^\d+\.\s/.test(trimmed)
    ) {
      const bulletText = trimmed
        .replace(/^[-*•]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1");
      currentList.push(bulletText);
      return;
    }

    // Bold inline text **word**
    flushList();
    const parts = trimmed.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{part}</strong>
        : part
    );

    elements.push(
      <p
        key={key++}
        style={{
          fontSize: "14px",
          lineHeight: "1.8",
          color: "var(--color-text-secondary)",
          margin: "4px 0"
        }}
      >
        {formatted}
      </p>
    );
  });

  flushList();
  return elements;
};

const FormattedResponse = ({ text }) => {
  if (!text) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        maxWidth: "100%"
      }}
    >
      {formatText(text)}
    </div>
  );
};

export default FormattedResponse;
