import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CodeBlock } from "@/components/academy/CodeBlock";
import { Blocks } from "@/components/academy/Blocks";
import { LangProvider } from "@/lib/i18n";
import type { CodeLang } from "@/content/types";
import { chapters } from "@/content/curriculum";
import { labSteps } from "@/content/lab-steps";
import { sourceFiles } from "@/content/source-files";

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const examples: { lang: CodeLang; code: string }[] = [
  { lang: "bash", code: "printf '%s\\n' '<tag> & value'\n# comment\n" },
  { lang: "yaml", code: 'message: "a # b"\r\nreplicas: 2\r\n' },
  {
    lang: "helm",
    code: '{{- define "web.fullname" -}}\n{{ printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}\n{{- end -}}\n',
  },
  { lang: "go", code: 'package main\n// a comment\nvar message = "<script> & text"' },
  { lang: "python", code: 'print("a # b")  # comment\n' },
  { lang: "makefile", code: 'build:\n\tgo build -o "$(OUTPUT)" ./cmd\n' },
  { lang: "promql", code: 'sum by (status) (rate(lab_requests_total{job="lab-collector"}[1m]))' },
  { lang: "json", code: '{"message":"<img src=x onerror=alert(1)>","encoded":"&amp;"}' },
];

describe("literal code presentation", () => {
  it.each(examples)(
    "renders and copies $lang without rewriting its characters",
    async ({ lang, code }) => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
      const { container } = render(<CodeBlock lang={lang} code={code} />);
      expect(container.querySelector("pre code")?.textContent).toBe(code);
      expect(container.querySelector("pre code img, pre code script")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(code));
      expect(await screen.findByRole("status")).toHaveTextContent("Copied");
    },
  );

  it("distinguishes a shell file from terminal commands and expected output", () => {
    const { rerender } = render(<CodeBlock lang="bash" code="echo hello" title="lab/example.sh" />);
    expect(screen.getByText("File · Shell")).toBeInTheDocument();
    rerender(<CodeBlock lang="bash" code="bash lab/example.sh" />);
    expect(screen.getByText("Terminal commands")).toBeInTheDocument();
    rerender(<CodeBlock lang="yaml" code="kind: Service\n" output />);
    expect(screen.getByText("Expected output · example")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("reports a failed clipboard operation instead of claiming success", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<CodeBlock lang="helm" code="{{ .Release.Name }}" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Copy failed");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("passes file metadata through guided steps and translates presentation labels", () => {
    window.localStorage.setItem("k8slab.lang", "fr");
    render(
      <LangProvider>
        <Blocks
          blocks={[
            {
              type: "steps",
              steps: [
                {
                  title: { en: "Save a file", fr: "Enregistrer un fichier" },
                  code: {
                    lang: "helm",
                    code: "{{ .Chart.Name }}",
                    title: "templates/_helpers.tpl",
                    kind: "file",
                  },
                  explain: { en: "Source template", fr: "Template source" },
                },
              ],
            },
          ]}
        />
      </LangProvider>,
    );
    expect(screen.getByText("Fichier · Helm template")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copier" })).toBeInTheDocument();
  });

  it("keeps Helm source expressions distinct from the rendered Service example", () => {
    const blocks = chapters.find((c) => c.id === "helm-charts")?.blocks ?? [];
    const helper = blocks.find((b) => b.type === "code" && b.title?.endsWith("_helpers.tpl"));
    if (helper?.type !== "code") throw new Error("Missing helpers");
    expect(helper.lang).toBe("helm");
    expect(helper.code).toContain('{{- define "academy-web.fullname" -}}');
    const rendered = blocks.find((b) => b.type === "code" && b.output && b.lang === "yaml");
    if (rendered?.type !== "code") throw new Error("Missing rendered example");
    expect(rendered.code).toContain("name: review-academy-web");
    expect(rendered.code).not.toContain("{{");
  });

  it("preserves literal text for all authored snippets including hidden solutions", () => {
    let checked = 0;
    const inspect = (value: unknown): void => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if (typeof record["code"] === "string" && typeof record["lang"] === "string") {
        const source = record["code"];
        const markup = renderToStaticMarkup(
          <CodeBlock code={source} lang={record["lang"] as CodeLang} />,
        );
        const host = document.createElement("div");
        host.innerHTML = markup;
        expect(host.querySelector("pre code")?.textContent).toBe(source);
        checked++;
      }
      Object.values(record).forEach(inspect);
    };
    inspect(chapters);
    expect(checked).toBeGreaterThan(480);
  });

  it("keeps all guided lab explanations and source notices bilingual", () => {
    const inspect = (value: unknown): void => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if ("en" in record || "fr" in record) {
        expect(typeof record["en"]).toBe("string");
        expect(typeof record["fr"]).toBe("string");
        expect(String(record["en"]).trim()).not.toBe("");
        expect(String(record["fr"]).trim()).not.toBe("");
      }
      Object.values(record).forEach(inspect);
    };
    inspect(labSteps);
    inspect(sourceFiles);
  });
});
