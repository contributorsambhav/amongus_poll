import { BellRing, Check } from "lucide-react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import { Switch } from "@/components/ui/switch"
import React, { useState } from "react"
import '../firebaseConfig'; // Add this line prevent firebase not loading error
import { getFirestore, addDoc, collection,doc,updateDoc,getDoc,where,getDocs,query } from "firebase/firestore"; 
import { set } from 'firebase/database';
import {toast} from 'react-toastify';

const notifications:any= [
 
]

type CardProps = React.ComponentProps<typeof Card>

export function PollsCard({ className, ...props }: any) {
  const {user,flag,setFlag,setUsers,users} = props;
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
const [error, setError] = useState(false);

  const handleVote = (userId: number) => {
    const updatedData = users.map((user:any) =>
      user.id === userId ? { ...user, votes: user.votes + 1 } : user
    );
    setUsers(updatedData);
  };

  const handleUnvote = (userId: number) => {
    const updatedData = users.map((user:any) =>
      user.id === userId ? { ...user, votes: user.votes - 1 } : user
    );
    setUsers(updatedData);
  };



  //firebase write function
const db = getFirestore();

const incrementVote = async (personId:any) => {
  const collectionRef:any = collection(db, "users");

  try {
    // Query Firestore to find the document with matching id
    setError(false);
    setLoading(true);
    const q = query(collectionRef, where("id", "==", personId));
    const querySnapshot:any= await getDocs(q);
    
    if (!querySnapshot.empty) {
      // There should be only one document matching the id
      const docRef = querySnapshot.docs[0].ref;
      const currentVotes = querySnapshot.docs[0].data().votes || 0; // Get current votes or default to 0
      const newVotes = currentVotes + 1;

      // Update the votes field of the document
      await updateDoc(docRef, { votes: newVotes });

      console.log(`Vote count for ${querySnapshot.docs[0].data().name} increased to ${newVotes}`);
      setLoading(false);
      setVoted(true);
      setFlag(false);
      toast.success("Vote counted successfully!");
    } else {
      console.log(`Person with ID ${personId} not found in the database`);
      setLoading(false);
      setError(true);
      toast.error("Person not found in database");
    }
  } catch (error) {
    console.error("Error updating vote count:", error)
    setLoading(false);
    setError(true);
    toast.error("Error updating vote count. Please try again.");
  }
};


const decrementVote = async (personId:any) => {
  const collectionRef = collection(db, "users");

  try {
    // Query Firestore to find the document with matching id
    setError(false);
    setLoading(true);
    const q = query(collectionRef, where("id", "==", personId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // There should be only one document matching the id
      const docRef = querySnapshot.docs[0].ref;
      const currentVotes = querySnapshot.docs[0].data().votes || 0; // Get current votes or default to 0
      const newVotes = Math.max(0, currentVotes - 1); // Ensure votes never go below zero

      // Update the votes field of the document
      await updateDoc(docRef, { votes: newVotes });



      console.log(`Vote count for ${querySnapshot.docs[0].data().name} decreased to ${newVotes}`);
      setLoading(false);
      setVoted(false);
      setFlag(true);
      toast.error("Vote removed successfully!");
     
    } else {
      console.log(`Person with ID ${personId} not found in the database`);
      setLoading(false);
      setError(true);
      toast.error("Person not found in database");
      
    }
  } catch (error) {
    console.error("Error updating vote count:", error);
    setLoading(false);
    setError(true);


    toast.error("Error updating vote count. Please try again.");
  }





};


  return (
    <Card className={cn("w-[80vw] mb-[20px]", className)} {...props}>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        {/* <CardDescription>Votes : {user.votes}</CardDescription> */}
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* <div className=" flex items-center space-x-4 rounded-md border p-4">
          <BellRing />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              Push Notifications
            </p>
            <p className="text-sm text-muted-foreground">
              Send notifications to device.
            </p>
          </div>
          <Switch />
        </div> */}
        <div>

          {!loading && <>

            {!voted && flag && <> <Button onClick={async ()=>{
            handleVote(user.id);
            await incrementVote(user.id);
            console.log("error",error);
            if(!error){
             

            }
            
         
            
          }}>Vote</Button></>}

          {voted && <> <Button variant="destructive" onClick={async()=>{
              handleUnvote(user.id);
              await decrementVote(user.id);
              if(!error){
                

              }
          
          
            
          }}>Remove Vote</Button></>}

          {
            !flag && !voted&&<Button className="bg-[#878B94] hover:bg-[#878B94]" onClick={()=>{
              alert("You cant only vote one person at a time")
            
            }} >Vote</Button>
          }


          
          
          
          
          </>}
          {
            loading && <Button className="bg-[#878B94] hover:bg-[#878B94]"> <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait</Button>
          }
        
        
       

        </div>
      </CardContent>
      {/* <CardFooter>
        <Button className="w-full">
          <Check className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </CardFooter> */}
    </Card>
  )
}
