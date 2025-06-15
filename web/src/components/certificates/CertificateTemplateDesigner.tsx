'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Save,
  Undo,
  Redo,
  Eye,
  Settings,
  Palette,
  Type,
  Image as ImageIcon,
  QrCode,
  Plus,
  ArrowLeft,
  Download,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  CertificateTemplateWithRelations,
  CertificateDesign,
  CertificateElement,
  DesignEditorState,
} from '@/types/certificate';
import { updateCertificateTemplate } from '@/lib/actions/certificate-template';
import { DesignCanvas } from './designer/DesignCanvas';
import { ElementPanel } from './designer/ElementPanel';
import { PropertiesPanel } from './designer/PropertiesPanel';
import { BackgroundPanel } from './designer/BackgroundPanel';
import { PreviewModal } from './designer/PreviewModal';

interface CertificateTemplateDesignerProps {
  template: CertificateTemplateWithRelations;
  canEdit: boolean;
  locale: string;
}

export function CertificateTemplateDesigner({
  template,
  canEdit,
  locale,
}: CertificateTemplateDesignerProps) {
  const t = useTranslations('certificates.designer');
  const router = useRouter();

  const [design, setDesign] = useState<CertificateDesign>(template.design);
  const [editorState, setEditorState] = useState<DesignEditorState>({
    selectedElement: null,
    clipboardElement: null,
    undoStack: [template.design],
    redoStack: [],
    zoom: 100,
    gridVisible: true,
    snapToGrid: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    'elements' | 'properties' | 'background'
  >('elements');

  // Track changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(design) !== JSON.stringify(template.design);
    setHasUnsavedChanges(hasChanges);
  }, [design, template.design]);

  // Auto-save functionality
  useEffect(() => {
    if (!canEdit || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(true); // Silent save
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [design, hasUnsavedChanges, canEdit]);

  const handleSave = async (silent = false) => {
    if (!canEdit || isSaving) return;

    setIsSaving(true);
    try {
      const result = await updateCertificateTemplate({
        id: template.id,
        design,
      });

      if (result.success) {
        setHasUnsavedChanges(false);
        if (!silent) {
          toast.success(t('actions.save.success'));
        }
      } else {
        toast.error(result.error || t('actions.save.error'));
      }
    } catch (error) {
      toast.error(t('actions.save.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateDesign = useCallback(
    (newDesign: CertificateDesign) => {
      if (!canEdit) return;

      // Add current design to undo stack
      setEditorState(prev => ({
        ...prev,
        undoStack: [...prev.undoStack, design].slice(-20), // Keep last 20 states
        redoStack: [], // Clear redo stack on new action
      }));

      setDesign(newDesign);
    },
    [design, canEdit]
  );

  const handleUndo = useCallback(() => {
    if (editorState.undoStack.length <= 1 || !canEdit) return;

    const previousDesign =
      editorState.undoStack[editorState.undoStack.length - 2];
    const newUndoStack = editorState.undoStack.slice(0, -1);

    setEditorState(prev => ({
      ...prev,
      undoStack: newUndoStack,
      redoStack: [design, ...prev.redoStack].slice(0, 20),
    }));

    setDesign(previousDesign);
  }, [editorState.undoStack, design, canEdit]);

  const handleRedo = useCallback(() => {
    if (editorState.redoStack.length === 0 || !canEdit) return;

    const nextDesign = editorState.redoStack[0];
    const newRedoStack = editorState.redoStack.slice(1);

    setEditorState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, design],
      redoStack: newRedoStack,
    }));

    setDesign(nextDesign);
  }, [editorState.redoStack, design, canEdit]);

  const handleElementSelect = useCallback((elementId: string | null) => {
    setEditorState(prev => ({
      ...prev,
      selectedElement: elementId,
    }));

    if (elementId) {
      setActivePanel('properties');
    }
  }, []);

  const handleElementUpdate = useCallback(
    (elementId: string, updates: Partial<CertificateElement>) => {
      if (!canEdit) return;

      const newDesign = {
        ...design,
        elements: design.elements.map(el =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      };

      updateDesign(newDesign);
    },
    [design, updateDesign, canEdit]
  );

  const handleElementAdd = useCallback(
    (element: Omit<CertificateElement, 'id'>) => {
      if (!canEdit) return;

      const newElement: CertificateElement = {
        ...element,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const newDesign = {
        ...design,
        elements: [...design.elements, newElement],
      };

      updateDesign(newDesign);
      handleElementSelect(newElement.id);
    },
    [design, updateDesign, handleElementSelect, canEdit]
  );

  const handleElementDelete = useCallback(
    (elementId: string) => {
      if (!canEdit) return;

      const newDesign = {
        ...design,
        elements: design.elements.filter(el => el.id !== elementId),
      };

      updateDesign(newDesign);

      if (editorState.selectedElement === elementId) {
        handleElementSelect(null);
      }
    },
    [
      design,
      updateDesign,
      editorState.selectedElement,
      handleElementSelect,
      canEdit,
    ]
  );

  const handleBackgroundUpdate = useCallback(
    (background: CertificateDesign['background']) => {
      if (!canEdit) return;

      const newDesign = {
        ...design,
        background,
      };

      updateDesign(newDesign);
    },
    [design, updateDesign, canEdit]
  );

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(t('actions.back.confirm'));
      if (!confirmLeave) return;
    }

    router.push('/dashboard/certificates/templates');
  };

  const selectedElement = design.elements.find(
    el => el.id === editorState.selectedElement
  );

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('actions.back.label')}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div>
              <h1 className="text-xl font-semibold">{template.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {design.layout}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {design.dimensions.width} × {design.dimensions.height}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    {t('status.unsaved')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={editorState.undoStack.length <= 1}
                >
                  <Undo className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={editorState.redoStack.length === 0}
                >
                  <Redo className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving
                    ? t('actions.save.saving')
                    : t('actions.save.label')}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('actions.preview')}
            </Button>

            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t('actions.export')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex w-80 flex-col border-r bg-gray-50">
          <Tabs
            value={activePanel}
            onValueChange={setActivePanel as any}
            className="flex flex-1 flex-col"
          >
            <TabsList className="m-4 mb-2 grid w-full grid-cols-3">
              <TabsTrigger value="elements" className="text-xs">
                <Plus className="mr-1 h-3 w-3" />
                {t('panels.elements.title')}
              </TabsTrigger>
              <TabsTrigger value="properties" className="text-xs">
                <Settings className="mr-1 h-3 w-3" />
                {t('panels.properties.title')}
              </TabsTrigger>
              <TabsTrigger value="background" className="text-xs">
                <Palette className="mr-1 h-3 w-3" />
                {t('panels.background.title')}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="elements" className="m-0 h-full p-4 pt-2">
                <ElementPanel
                  onElementAdd={handleElementAdd}
                  canEdit={canEdit}
                  locale={locale}
                />
              </TabsContent>

              <TabsContent value="properties" className="m-0 h-full p-4 pt-2">
                <PropertiesPanel
                  element={selectedElement}
                  onElementUpdate={handleElementUpdate}
                  onElementDelete={handleElementDelete}
                  canEdit={canEdit}
                  locale={locale}
                />
              </TabsContent>

              <TabsContent value="background" className="m-0 h-full p-4 pt-2">
                <BackgroundPanel
                  background={design.background}
                  onBackgroundUpdate={handleBackgroundUpdate}
                  canEdit={canEdit}
                  locale={locale}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Main Canvas */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DesignCanvas
            design={design}
            selectedElement={editorState.selectedElement}
            onElementSelect={handleElementSelect}
            onElementUpdate={handleElementUpdate}
            onElementAdd={handleElementAdd}
            canEdit={canEdit}
            zoom={editorState.zoom}
            gridVisible={editorState.gridVisible}
            snapToGrid={editorState.snapToGrid}
          />
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        design={design}
        templateName={template.name}
        locale={locale}
      />
    </div>
  );
}
