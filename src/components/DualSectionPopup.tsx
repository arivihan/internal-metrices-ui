import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Copy, X } from "lucide-react";
import { dynamicRequest } from "@/services/apiClient";

interface DualSectionPopupProps {
  open: boolean;
  onClose: () => void;
  button: any;
  onSubmit: (payload: any) => void;
  isSubmitting: boolean;
}

export function DualSectionPopup({
  open,
  onClose,
  button,
  onSubmit,
  isSubmitting,
}: DualSectionPopupProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedGrades, setSelectedGrades] = useState<any[]>([]);
  const [gradeOptions, setGradeOptions] = useState<any[]>([]);
  const [displayOrders, setDisplayOrders] = useState<Record<string, number>>({});
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingAllGrades, setLoadingAllGrades] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [searchExam, setSearchExam] = useState("");
  const [searchGrade, setSearchGrade] = useState("");
  const [modalSelectedGradeIds, setModalSelectedGradeIds] = useState<Set<string>>(new Set());

  if (!button) return null;

  const leftSection = button.leftSection;
  const rightSection = button.rightSection;
  const actions = button.popupActions || [];

  // Fetch exams on mount
  useEffect(() => {
    if (!open) return;
    const fetchExams = async () => {
      if (leftSection?.fetchUrl) {
        setLoadingExams(true);
        try {
          const response: any = await dynamicRequest(leftSection.fetchUrl, "GET");
          console.log("[DualSectionPopup] response:", response);
          
          let data: any[] = [];
          if (Array.isArray(response)) {
            data = response;
          } else if (response?.content && Array.isArray(response.content)) {
            data = response.content;
          } else if (response?.data && Array.isArray(response.data)) {
            data = response.data;
          }
          
          console.log("[DualSectionPopup] Parsed exams:", data);
          setExams(data);
        } catch (error) {
          console.error("Error fetching exams:", error);
        } finally {
          setLoadingExams(false);
        }
      }
    };
    fetchExams();
  }, [open, leftSection]);

  // Fetch grades for selected exam
  useEffect(() => {
    if (!selectedExam || !rightSection?.fetchUrl) return;

    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const response: any = await dynamicRequest(
          `${rightSection.fetchUrl}?${rightSection.searchParam}=${selectedExam}`,
          "GET"
        );
        console.log("[DualSectionPopup] Grades response:", response);
        
        let data: any[] = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response?.content && Array.isArray(response.content)) {
          data = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          data = response.data;
        }
        
        console.log("[DualSectionPopup] Parsed grades:", data);
        
        // Set the already-mapped grades for display
        setGradeOptions(data);
        setSelectedGrades(data);
        
        // Initialize display orders for already-mapped grades
        const orders: Record<string, number> = {};
        data.forEach((grade: any, idx: number) => {
          const gradeId = String(grade[rightSection.optionValueKey]);
          // Use existing displayOrder if available, otherwise use index
          orders[gradeId] = grade.displayOrder || (idx + 1);
        });
        setDisplayOrders(orders);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [selectedExam, rightSection]);

  // Fetch all grades for modal
  const handleAddGradesClick = async () => {
    const modalConfig = actions.find((a: any) => a.id === "add-grades");
    if (modalConfig?.modalFetchUrl) {
      setLoadingAllGrades(true);
      try {
        const response: any = await dynamicRequest(modalConfig.modalFetchUrl, "GET");
        console.log("[DualSectionPopup] All grades response:", response);
        
        let data: any[] = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response?.content && Array.isArray(response.content)) {
          data = response.content;
        } else if (response?.data && Array.isArray(response.data)) {
          data = response.data;
        }
        
        console.log("[DualSectionPopup] Parsed all grades:", data);
        setAllGrades(data);
        setShowGradesModal(true);
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoadingAllGrades(false);
      }
    }
  };

  const handleAddGrades = (selectedGradeIds: string[]) => {
    const modalConfig = actions.find((a: any) => a.id === "add-grades");
    const modalValueKey = modalConfig?.modalOptionValueKey || "id";
    const modalLabelKey = modalConfig?.modalOptionLabelKey || "name";
    
    // Get selected grades from the modal (they come from allGrades which is fetched from modalFetchUrl)
    const newGrades = allGrades.filter((g) =>
      selectedGradeIds.includes(String(g[modalValueKey]))
    );

    // Transform grades to match rightSection structure
    const transformedGrades = newGrades.map((grade) => ({
      ...grade,
      [rightSection.optionValueKey]: grade[modalValueKey], // Map modal id to gradeId
      [rightSection.optionLabelKey]: grade[modalLabelKey], // Map modal label to gradeName
    }));

    // Add new grades to selected (avoid duplicates based on rightSection.optionValueKey)
    const existingIds = selectedGrades.map((g) => g[rightSection.optionValueKey]);
    const uniqueNewGrades = transformedGrades.filter(
      (g) => !existingIds.includes(g[rightSection.optionValueKey])
    );

    const combined = [...selectedGrades, ...uniqueNewGrades];
    console.log("[DualSectionPopup] Adding grades:", {
      newGrades,
      transformedGrades,
      uniqueNewGrades,
      combined,
    });
    setSelectedGrades(combined);

    // Auto-set display orders for new grades
    const maxOrder = Math.max(0, ...Object.values(displayOrders));
    uniqueNewGrades.forEach((grade, idx) => {
      const gradeId = String(grade[rightSection.optionValueKey]);
      setDisplayOrders((prev) => ({
        ...prev,
        [gradeId]: maxOrder + idx + 1,
      }));
    });

    setShowGradesModal(false);
  };

  const handleRemoveGrade = (gradeId: string, isNewlyAdded: boolean) => {
    // Only allow removing newly added grades
    if (!isNewlyAdded) {
      console.warn("[DualSectionPopup] Cannot remove originally mapped grade:", gradeId);
      return;
    }
    
    console.log("[DualSectionPopup] Removing grade:", { gradeId, isNewlyAdded });
    
    setSelectedGrades((prev) => {
      const filtered = prev.filter((g) => String(g[rightSection.optionValueKey]) !== gradeId);
      console.log("[DualSectionPopup] Filtered grades:", { before: prev.length, after: filtered.length, removed: gradeId });
      return filtered;
    });
    
    setDisplayOrders((prev) => {
      const updated = { ...prev };
      delete updated[gradeId];
      return updated;
    });
  };

  const handleSubmit = () => {
    // Filter only newly added grades (not in original gradeOptions)
    const newlyAddedGrades = selectedGrades.filter(
      (g) => !gradeOptions.some((og) => String(og[rightSection.optionValueKey]) === String(g[rightSection.optionValueKey]))
    );

    // Create a CLEAN payload with only necessary fields (no circular references)
    const payload = {
      [leftSection.fieldName]: parseInt(selectedExam, 10),
      [rightSection.fieldName]: newlyAddedGrades.map((g) => {
        const gradeId = String(g[rightSection.optionValueKey]);
        return {
          gradeId: parseInt(gradeId, 10),
          displayOrder: parseInt(String(displayOrders[gradeId] || 0), 10),
        };
      }),
    };
    
    console.log("[DualSectionPopup] Final payload:", JSON.stringify(payload, null, 2));
    console.log("[DualSectionPopup] Newly added count:", newlyAddedGrades.length);
    console.log("[DualSectionPopup] Sending clean payload:", payload);
    onSubmit(payload);
  };

  const filteredExams = exams.filter((e) => {
    const displayText = e[leftSection.optionLabelKey] || e["displayName"] || e["name"] || `Exam ${e[leftSection.optionValueKey]}`;
    return String(displayText).toLowerCase().includes(searchExam.toLowerCase());
  });

  const filteredGrades = selectedGrades.filter((g) => {
    const displayText = g[rightSection.optionLabelKey] || g["gradeName"] || g["name"] || `Grade ${g[rightSection.optionValueKey]}`;
    return String(displayText).toLowerCase().includes(searchGrade.toLowerCase());
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-none! max-h-[90vh] w-[65vw] p-0 flex flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{button.popupTitle}</DialogTitle>
            <DialogDescription>{button.popupSubtitle}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4 px-6 py-4">
            {/* Left Section - Exams */}
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{leftSection.title}</CardTitle>
                  <CardDescription>{leftSection.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <Input
                    placeholder={leftSection.placeholder}
                    value={searchExam}
                    onChange={(e) => setSearchExam(e.target.value)}
                    className="h-9"
                  />
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {loadingExams ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      filteredExams.map((exam) => {
                        const examLabel = exam[leftSection.optionLabelKey] || exam["displayName"] || exam["name"] || `Exam ${exam[leftSection.optionValueKey]}`;
                        return (
                          <button
                            key={exam[leftSection.optionValueKey]}
                            onClick={() => setSelectedExam(String(exam[leftSection.optionValueKey]))}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                              String(exam[leftSection.optionValueKey]) === selectedExam
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent hover:bg-accent/80"
                            }`}
                          >
                            {examLabel}
                          </button>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Section - Grades */}
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{rightSection.title}</CardTitle>
                  <CardDescription>{rightSection.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <Input
                    placeholder={rightSection.placeholder || "Search grades..."}
                    value={searchGrade}
                    onChange={(e) => setSearchGrade(e.target.value)}
                    className="h-9"
                  />
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {!selectedExam ? (
                      <div className="text-center text-muted-foreground py-8">
                        Select an exam to view mapped grades
                      </div>
                    ) : loadingGrades ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredGrades.length > 0 ? (
                      filteredGrades.map((grade, idx) => {
                        const gradeId = String(grade[rightSection.optionValueKey]);
                        const gradeLabel = grade[rightSection.optionLabelKey] || grade["displayName"] || grade["gradeName"] || grade["name"] || `Grade ${gradeId}`;
                        // Check if this grade is newly added (not in original gradeOptions)
                        const isNewlyAdded = !gradeOptions.some((g) => String(g[rightSection.optionValueKey]) === gradeId);
                        return (
                          <div
                            key={gradeId}
                            className="flex items-center gap-2 bg-primary/10 p-2 rounded-md border border-primary/20"
                          >
                            <div className="flex-1 flex items-center gap-2">
                              <div className="text-sm font-medium">
                                {gradeLabel}
                              </div>
                              {isNewlyAdded && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                  Newly Added
                                </span>
                              )}
                            </div>
                            {rightSection.includeDisplayOrder && (
                              <input
                                type="number"
                                min="0"
                                value={displayOrders[gradeId] || idx + 1}
                                onChange={(e) =>
                                  setDisplayOrders((prev) => ({
                                    ...prev,
                                    [gradeId]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                placeholder="Order"
                                className="w-16 h-8 px-2 py-1 text-sm border border-input rounded"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveGrade(gradeId, isNewlyAdded);
                              }}
                              disabled={!isNewlyAdded}
                              className={`p-1 rounded transition-colors ${
                                isNewlyAdded 
                                  ? "text-destructive hover:bg-destructive/10 cursor-pointer" 
                                  : "text-gray-400 cursor-not-allowed opacity-50"
                              }`}
                              title={isNewlyAdded ? "Remove grade" : "Cannot remove originally mapped grades"}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No grades selected. Click "Add Grades" to add.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4 flex justify-between">
            <div className="flex gap-2">
              {actions.map((action: any) => (
                <Button
                  key={action.id}
                  variant={action.buttonVariant || "outline"}
                  size="sm"
                  disabled={isSubmitting || !selectedExam}
                  onClick={() => {
                    if (action.id === "add-grades") {
                      handleAddGradesClick();
                    } else if (action.id === "copy") {
                      // TODO: Implement copy functionality
                    }
                  }}
                  className="gap-2"
                >
                  {action.id === "add-grades" && <Plus className="h-4 w-4" />}
                  {action.id === "copy" && <Copy className="h-4 w-4" />}
                  {action.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedExam || selectedGrades.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  button.popupSubmitText || "Update"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grades Selection Modal */}
      <Dialog open={showGradesModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setModalSelectedGradeIds(new Set());
        }
        setShowGradesModal(isOpen);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actions.find((a: any) => a.id === "add-grades")?.modalTitle}
            </DialogTitle>
            <DialogDescription>
              {actions.find((a: any) => a.id === "add-grades")?.modalDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            {loadingAllGrades ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {allGrades.map((grade) => {
                  const modalConfig = actions.find((a: any) => a.id === "add-grades");
                  const gradeIdKey = modalConfig?.modalOptionValueKey || "id";
                  const gradeLabelKey = modalConfig?.modalOptionLabelKey || "name";
                  const gradeId = String(grade[gradeIdKey]);
                  const gradeLabel = grade[gradeLabelKey] || grade["displayName"] || grade["gradeName"] || grade["name"] || `Grade ${gradeId}`;
                  
                  // Check if grade is already mapped (from initial fetch)
                  const isMapped = gradeOptions.some((g) => String(g[rightSection.optionValueKey]) === gradeId);
                  // Check if grade is selected in modal
                  const isModalSelected = modalSelectedGradeIds.has(gradeId);
                  // Check if grade is already in selectedGrades
                  const isAlreadyAdded = selectedGrades.some((g) => String(g[rightSection.optionValueKey]) === gradeId);

                  return (
                    <button
                      key={gradeId}
                      onClick={() => {
                        const newSet = new Set(modalSelectedGradeIds);
                        if (newSet.has(gradeId)) {
                          newSet.delete(gradeId);
                        } else {
                          newSet.add(gradeId);
                        }
                        setModalSelectedGradeIds(newSet);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${
                        isModalSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gradeLabel}</span>
                        <div className="flex gap-2 items-center">
                          {isMapped && !isAlreadyAdded && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              Mapped
                            </span>
                          )}
                          {isAlreadyAdded && (
                            <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-600 rounded-full font-medium">
                              Already Mapped
                            </span>
                          )}
                          {isModalSelected && <span className="text-primary font-bold">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setModalSelectedGradeIds(new Set());
              setShowGradesModal(false);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddGrades(Array.from(modalSelectedGradeIds));
                setModalSelectedGradeIds(new Set());
              }}
              disabled={modalSelectedGradeIds.size === 0}
            >
              Add Selected ({modalSelectedGradeIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
