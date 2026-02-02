/**
 * Landing Page Editor
 * Allows merchants to toggle sections and edit text content
 */

import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { LandingPageContent } from "~/services/ai/types";
import type { LandingPageVisibility } from "./LandingPagePreview";
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layout,
  MessageSquare,
  BarChart3,
  Gift,
  GitCompare,
  HelpCircle,
  Save,
  RotateCcw,
} from "lucide-react";

// Section configuration
const SECTIONS = [
  { id: "hero", label: "العنوان الرئيسي", labelEn: "Hero", icon: Sparkles },
  { id: "features", label: "المميزات", labelEn: "Features", icon: Layout },
  { id: "cta", label: "زر الشراء", labelEn: "Call to Action", icon: MessageSquare },
  { id: "socialProof", label: "الإحصائيات", labelEn: "Social Proof", icon: BarChart3 },
  { id: "benefits", label: "الفوائد", labelEn: "Benefits", icon: Gift },
  { id: "comparison", label: "المقارنة", labelEn: "Comparison", icon: GitCompare },
  { id: "faq", label: "الأسئلة الشائعة", labelEn: "FAQ", icon: HelpCircle },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

interface LandingPageEditorProps {
  content: LandingPageContent | null;
  productId: string;
  onContentChange?: (content: LandingPageContent, visibility: LandingPageVisibility) => void;
}

export function LandingPageEditor({ content, productId, onContentChange }: LandingPageEditorProps) {
  const fetcher = useFetcher();
  const isSaving = fetcher.state === "submitting";

  // Initialize visibility (all visible by default)
  const [visibility, setVisibility] = useState<LandingPageVisibility>(() => {
    const saved = (content as LandingPageContent & { _visibility?: LandingPageVisibility })?._visibility;
    return saved || {
      hero: true,
      features: true,
      cta: true,
      socialProof: true,
      benefits: true,
      comparison: true,
      faq: true,
    };
  });

  // Editable content (deep copy to avoid mutations)
  const [editedContent, setEditedContent] = useState<LandingPageContent | null>(
    content ? JSON.parse(JSON.stringify(content)) : null
  );

  // Track which section is expanded for editing
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(null);

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update parent when content or visibility changes
  useEffect(() => {
    if (editedContent && onContentChange) {
      onContentChange(editedContent, visibility);
    }
  }, [editedContent, visibility, onContentChange]);

  const toggleVisibility = (sectionId: SectionId) => {
    setVisibility(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
    setHasChanges(true);
  };

  const toggleExpand = (sectionId: SectionId) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const updateField = (path: string, value: string) => {
    if (!editedContent) return;

    setEditedContent(prev => {
      if (!prev) return prev;
      const updated = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj: Record<string, unknown> = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!editedContent) return;

    // Merge visibility into content for storage
    const contentWithVisibility = {
      ...editedContent,
      _visibility: visibility,
    };

    fetcher.submit(
      {
        intent: "update-landing-page",
        content: JSON.stringify(contentWithVisibility),
      },
      { method: "post" }
    );
    setHasChanges(false);
  };

  const handleReset = () => {
    if (!content) return;
    setEditedContent(JSON.parse(JSON.stringify(content)));
    const saved = (content as LandingPageContent & { _visibility?: LandingPageVisibility })?._visibility;
    setVisibility(saved || {
      hero: true,
      features: true,
      cta: true,
      socialProof: true,
      benefits: true,
      comparison: true,
      faq: true,
    });
    setHasChanges(false);
  };

  if (!content || !editedContent) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">أنشئ صفحة الهبوط أولاً للتعديل عليها</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900 text-sm">تعديل الأقسام</h3>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded"
              title="تراجع"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              hasChanges
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-3 h-3" />
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isVisible = visibility[section.id];
          const isExpanded = expandedSection === section.id;

          return (
            <div
              key={section.id}
              className={`border-b border-gray-100 ${!isVisible ? "opacity-50" : ""}`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2 p-3 bg-white">
                {/* Visibility Toggle */}
                <button
                  onClick={() => toggleVisibility(section.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isVisible
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                  title={isVisible ? "إخفاء" : "إظهار"}
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Section Label */}
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-sm font-medium text-gray-700">
                  {section.label}
                </span>

                {/* Expand Toggle */}
                {isVisible && (
                  <button
                    onClick={() => toggleExpand(section.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Section Editor (Expanded) */}
              {isVisible && isExpanded && (
                <div className="p-3 bg-gray-50 space-y-3">
                  {section.id === "hero" && (
                    <>
                      <EditableField
                        label="العنوان الرئيسي"
                        value={editedContent.hero.headline}
                        onChange={(v) => updateField("hero.headline", v)}
                      />
                      <EditableField
                        label="العنوان الفرعي"
                        value={editedContent.hero.subheadline}
                        onChange={(v) => updateField("hero.subheadline", v)}
                        multiline
                      />
                    </>
                  )}

                  {section.id === "features" && (
                    <>
                      <EditableField
                        label="عنوان القسم"
                        value={editedContent.features.title}
                        onChange={(v) => updateField("features.title", v)}
                      />
                      <EditableField
                        label="الوصف"
                        value={editedContent.features.description}
                        onChange={(v) => updateField("features.description", v)}
                        multiline
                      />
                    </>
                  )}

                  {section.id === "cta" && (
                    <>
                      <EditableField
                        label="العنوان"
                        value={editedContent.cta.headline}
                        onChange={(v) => updateField("cta.headline", v)}
                      />
                      <EditableField
                        label="الوصف"
                        value={editedContent.cta.description}
                        onChange={(v) => updateField("cta.description", v)}
                        multiline
                      />
                      <EditableField
                        label="نص الزر"
                        value={editedContent.cta.buttonText}
                        onChange={(v) => updateField("cta.buttonText", v)}
                      />
                    </>
                  )}

                  {section.id === "socialProof" && (
                    <EditableField
                      label="عنوان القسم"
                      value={editedContent.socialProof.title}
                      onChange={(v) => updateField("socialProof.title", v)}
                    />
                  )}

                  {section.id === "comparison" && (
                    <>
                      <EditableField
                        label="عنوان القسم"
                        value={editedContent.comparison.title}
                        onChange={(v) => updateField("comparison.title", v)}
                      />
                      <EditableField
                        label="الوصف"
                        value={editedContent.comparison.description}
                        onChange={(v) => updateField("comparison.description", v)}
                        multiline
                      />
                    </>
                  )}

                  {(section.id === "benefits" || section.id === "faq") && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      يمكنك إظهار/إخفاء هذا القسم فقط
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          اضغط على 👁 لإظهار/إخفاء • اضغط على السهم للتعديل
        </p>
      </div>
    </div>
  );
}

// Editable Field Component
function EditableField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:outline-none"
        />
      )}
    </div>
  );
}

// Note: LandingPageVisibility is exported from LandingPagePreview.tsx
