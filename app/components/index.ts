// Common & Layout Shell
export { AppHeader } from "./common/AppHeader";
export { Dialog } from "./common/Dialog";
export { PWAProvider, usePWA } from "./common/PWAClient";

// Element Explorer (Atomic)
export { ExplorerApp } from "./explorer/ExplorerApp";
export { AtomViewer } from "./explorer/AtomViewer";
export {
  AtomicInfoPanel,
  AtomicLearningCards,
  type AtomicInfoPanelProps,
  type AtomicLearningCardsProps,
} from "./explorer/AtomicContent";
export { PeriodicTable } from "./explorer/PeriodicTable";
export { ComparisonPanel } from "./explorer/ComparisonPanel";
export { QuizModal } from "./explorer/QuizModal";
export { SavedModal } from "./explorer/SavedModal";
export { FirstVisitTour } from "./explorer/FirstVisitTour";

// Molecules Studio & VSEPR
export { MoleculeStudio } from "./molecules/MoleculeStudio";
export { MoleculeViewer } from "./molecules/MoleculeViewer";
export { LewisViewer } from "./molecules/LewisViewer";

// Reactions Lab & Stoichiometry
export { ReactionLab } from "./reactions/ReactionLab";
export { ReactionViewer } from "./reactions/ReactionViewer";

// Periodic Trends Matrix
export { TrendsStudio } from "./trends/TrendsStudio";
export { TrendsGraph } from "./trends/TrendsGraph";
export { Periodic3DElevation } from "./trends/Periodic3DElevation";
export { PeriodicHeatmapTable } from "./trends/PeriodicHeatmapTable";
