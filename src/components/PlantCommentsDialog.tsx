import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { Plant, Comment } from "./PlantCard";

interface PlantCommentsDialogProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComment: (plantId: string, comment: string) => void;
}

export const PlantCommentsDialog = ({ plant, open, onOpenChange, onAddComment }: PlantCommentsDialogProps) => {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim() && plant) {
      onAddComment(plant.id, newComment.trim());
      setNewComment("");
    }
  };

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments for {plant.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new comment */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment about this plant..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>

          <Separator />

          {/* Comments list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              Comments ({plant.comments?.length || 0})
            </h4>
            
            {(!plant.comments || plant.comments.length === 0) ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No comments yet. Add the first one above!
              </p>
            ) : (
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-3 pr-4">
                  {(plant.comments || [])
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3 bg-muted/30">
                        <p className="text-sm text-foreground mb-2">{comment.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};