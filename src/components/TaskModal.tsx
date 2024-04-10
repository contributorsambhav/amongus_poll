import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import React from 'react'
import { MemberCard } from "./MemberCard"

const TaskModal = (props:any) => {
    const {open,setOpen}=props
  return (
    <div>
        <Dialog open={open} onOpenChange={setOpen}>
  {/* <DialogTrigger >Open</DialogTrigger> */}
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="mb-[20px]"> Alive Team Members</DialogTitle>
      <DialogDescription className="overflow-y-auto">
        <MemberCard />
        <MemberCard />
        <MemberCard />
        <MemberCard />

        {/* <p className=" w-[100%] text-center">No Members Alive</p> */}
     
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>

      
    </div>
  )
}

export default TaskModal
  