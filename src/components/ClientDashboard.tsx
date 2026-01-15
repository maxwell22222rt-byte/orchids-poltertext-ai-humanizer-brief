"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  RefreshCw,
  Loader2,
  Clock,
  FileText,
  CheckSquare,
  Square,
  ChevronRight,
  AlertCircle,
  Ghost,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  original_text: string;
  humanized_text: string;
  tone: string;
  readability: string;
  word_count: number;
  created_at: string;
  model?: string;
}

interface ClientDashboardProps {
  onLoadOrder?: (order: Order) => void;
}

export function ClientDashboard({ onLoadOrder }: ClientDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log("[ClientDashboard] Fetching orders...");

    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/orders?_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      const data = await response.json();
      console.log("[ClientDashboard] Received data:", data);

      if (data.success && data.orders) {
        setOrders(data.orders);
        console.log("[ClientDashboard] Set", data.orders.length, "orders");
      } else if (data.history) {
        // Fallback to history format
        setOrders(data.history);
        console.log("[ClientDashboard] Set", data.history.length, "orders from history");
      } else {
        throw new Error(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("[ClientDashboard] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Toggle single selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(new Set(orders.map((o) => o.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Delete selected orders
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    console.log("[ClientDashboard] Deleting selected orders:", Array.from(selectedIds));

    try {
      const response = await fetch("/api/orders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });

      const data = await response.json();
      console.log("[ClientDashboard] Delete response:", data);

      if (data.success) {
        // Remove deleted orders from state
        setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
        setSelectedIds(new Set());
        console.log("[ClientDashboard] Successfully deleted", data.deletedCount, "orders");
      } else {
        throw new Error(data.error || "Failed to delete orders");
      }
    } catch (err) {
      console.error("[ClientDashboard] Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete orders");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Delete single order
  const deleteSingleOrder = async () => {
    if (!singleDeleteId) return;

    setIsDeleting(true);
    console.log("[ClientDashboard] Deleting single order:", singleDeleteId);

    try {
      const response = await fetch("/api/orders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [singleDeleteId] }),
      });

      const data = await response.json();
      console.log("[ClientDashboard] Delete response:", data);

      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== singleDeleteId));
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(singleDeleteId);
          return newSet;
        });
        console.log("[ClientDashboard] Successfully deleted order");
      } else {
        throw new Error(data.error || "Failed to delete order");
      }
    } catch (err) {
      console.error("[ClientDashboard] Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setIsDeleting(false);
      setSingleDeleteId(null);
    }
  };

  // Open delete confirmation for single order
  const confirmDeleteSingle = (id: string) => {
    setSingleDeleteId(id);
  };

  // Open bulk delete confirmation
  const confirmDeleteSelected = () => {
    if (selectedIds.size > 0) {
      setDeleteDialogOpen(true);
    }
  };

  return (
    <div className="w-full">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-card/30 rounded-xl border border-border/30">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your Orders
          </h2>
          <Badge variant="outline" className="font-mono">
            {orders.length} total
          </Badge>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="font-medium">
              {selectedIds.size} selected
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select All / Deselect All */}
          {orders.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={selectedIds.size === orders.length}
                className="h-9"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={selectedIds.size === 0}
                className="h-9"
              >
                <Square className="w-4 h-4 mr-2" />
                Deselect All
              </Button>
            </>
          )}

          {/* Delete Selected */}
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteSelected}
              disabled={isDeleting}
              className="h-9"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="h-9"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-8"
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Orders List */}
      <div className="bg-card/30 border border-border/30 rounded-2xl overflow-hidden">
        {isLoading && orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <Ghost className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your humanization history will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-4 hover:bg-primary/5 transition-colors group ${
                    selectedIds.has(order.id) ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelection(order.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>

                    {/* Order content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onLoadOrder?.(order)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-primary/30 text-primary"
                        >
                          {order.tone}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-medium border-border/50">
                          {order.readability}
                        </Badge>
                        {order.model && (
                          <Badge variant="secondary" className="text-[10px]">
                            {order.model}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground font-serif line-clamp-2 mb-2">
                        "{order.original_text.slice(0, 150)}
                        {order.original_text.length > 150 ? "..." : ""}"
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {order.word_count} words
                        </span>
                        <span className="flex items-center gap-1.5 text-primary/70 group-hover:text-primary transition-colors">
                          <ChevronRight className="w-3 h-3" />
                          Click to load
                        </span>
                      </div>
                    </div>

                    {/* Individual delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteSingle(order.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete {selectedIds.size} Order{selectedIds.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{selectedIds.size}</span> order
              {selectedIds.size > 1 ? "s" : ""} from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedIds.size} Order{selectedIds.size > 1 ? "s" : ""}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!singleDeleteId} onOpenChange={() => setSingleDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete This Order?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this order from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSingleOrder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
