'use client'
import React,{useState,useEffect} from 'react'
import '../firebaseConfig'; // Add this line prevent firebase not loading error
import { getFirestore, addDoc, collection,doc,updateDoc,getDoc,where,getDocs,query,orderBy } from "firebase/firestore"; 
import { set } from 'firebase/database';
import { Loader2 } from "lucide-react"


const page = () => {

    const [data, setData] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Initialize Firestore
    const db= getFirestore();
    //fetching from database
    const fetchDataFromFirestore = async () => {
        try {
          const usersCollectionRef = collection(db, 'users');
      
          // Query all documents from the 'users' collection and order by 'votes' in descending order
          const q = query(usersCollectionRef, orderBy('votes', 'desc'));
          const querySnapshot = await getDocs(q);
      
          // Extract data from querySnapshot into an array of user objects
          const users:any = querySnapshot.docs.map((doc) => doc.data());
      
          // Check the top two users to determine if they have the same highest votes
          let message = '';
          if (users.length >= 2 && users[0].votes === users[1].votes) {
            message = `No one was removed`;
          } else {
            ///// to- do delete query
            message = `${users[0].name} has been removed.`;
          }
      
          // Set the state with the top users
          setData(users);
      
          // Set the message state
          setMessage(message); 
            setLoading(false);
          // Assuming setMessage is a state update function from React useState hook
        } catch (error) {
          console.error('Error fetching data from Firestore:', error);
           setLoading(false);
            setMessage(`Error fetching data from Firestore: ${error}`);

          // Handle error (e.g., show error message to user)
        }
      };

        useEffect(() => {
            fetchDataFromFirestore();
        }, []);



  return (
    <div className='flex w-screen h-screen justify-center items-center text-white flex-col'>
        <video id="backgroundVideo" autoPlay muted loop className='h-screen w-[100vw] absolute top-0 left-0 object-cover' style={{zIndex: -1}} suppressHydrationWarning>
  <source src="/75318-555531864_large.mp4" type="video/mp4"/>
  Your browser does not support the video tag.
</video>
    <h1 className='mb-[25px] text-2xl'>{message}</h1>

    {/* <p className='mb-[8px]'>#1  : 4 votes</p> */}
    {!loading&& data.map((user:any,index:number)=>(
        <p key={index} className='mb-[8px]'>#{index+1} {user.name} : {user.votes} votes</p>
    ))}

    {loading&&<>

        <Loader2 className="mr-2 h-8 w-8 mb-[10px] animate-spin" />
            
    
    <p>Loading...</p></>}
   




      
    </div>
  )
}

export default page
