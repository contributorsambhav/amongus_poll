import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScoreCard(props) {
  const { scoreModal, setScoreModal } = props;

  // State variables for form inputs
  const [name, setName] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [score, setScore] = useState('');

  // Handle form submission
  const handleSubmit = (event:any) => {
    event.preventDefault();
    // Perform form submission logic here (e.g., send data to backend)
    console.log('Form submitted with data:', { name, volunteerId, taskId, score });
    // Close the dialog modal after form submission
    setScoreModal(false);
  };

  return (
    <Dialog onOpenChange={setScoreModal} open={scoreModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Score</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Your Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                type='text'
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="volunteerId" className="text-right">
                Volunteer Id
              </Label>
              <Input
                id="volunteerId"
                placeholder="Enter your volunteer id"
                value={volunteerId}
                onChange={(e) => setVolunteerId(e.target.value)}
                className="col-span-3"
                type='number'
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskId" className="text-right">
                Task Id
              </Label>
              <Input
                id="taskId"
                placeholder="Enter the task id"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="col-span-3"
                required
                type='number'
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                Score
              </Label>
              <Input
                id="score"
                placeholder="Enter the score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="col-span-3"
                required
                type='number'
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}