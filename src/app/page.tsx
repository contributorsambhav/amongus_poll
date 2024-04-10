'use client'

import { PollsCard } from '@/components/pollsCard';
import { Search } from '@/components/search'
// import { UserCard } from '@/components/usersCard'
import React,{useState,useEffect} from 'react'
import {toast} from 'react-toastify';
// import '../../../firebaseConfig'; // Add this line prevent firebase not loading error
import { getFirestore, addDoc, collection,doc,updateDoc,getDoc,where,getDocs,query } from "firebase/firestore"; 
import firebase_app from '@/firebaseConfig';
// import { set } from 'firebase/database';
import { Loader2 } from 'lucide-react';


const Page = ({params}: {params: {pollId: string}}) => {
 const userId =params.pollId;
 console.log("userid",userId);

const data = [
  { id: 1, name: 'John Doe', voters: 0},
  { id: 2, name: 'Jane Doe', votes: 0 },
  { id: 3, name: 'John Smith', votes: 0 }
  //fetch from db
];
let initialData:any = [];
const [users, setUsers] = useState([]);
const [flag, setFlag] = useState(true);
const [searchText, setSearchText] = useState('');
const [loading, setLoading] = useState(false);


const response = []

// const [voted,setVoted] = useState(false);

const filterData = (searchText:any) => {
  const filteredResults = users.filter((user:any) => {
    const lowerCaseSearch = searchText.toLowerCase();
    return (
      user.id.toString().includes(lowerCaseSearch) ||
      user.name.toLowerCase().includes(lowerCaseSearch)
    );
  });
  setUsers(filteredResults);
};

const db = getFirestore(firebase_app);

const fetchDataFromFirestore = async (userId:any) => {
  try {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "users"));
    const temporaryArr:any = [];

    querySnapshot.forEach((doc) => {
      temporaryArr.push(doc.data());
    });

    // Filter the fetched data to exclude users with a specific userId
    console.log("temporaryArr", temporaryArr);
    const filteredUsers = temporaryArr.filter((user:any) => user.id !== parseInt(userId));

    // Log filtered users (optional)
    console.log("filteredUsers", filteredUsers);

    // Set the state (users) with filtered data
    setUsers(filteredUsers); // Assuming setUsers is a state update function from React useState hook
    setLoading(false);
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
    toast.error("Error fetching data from Firestore: " + error);
    setLoading(false);
    // Handle error (e.g., show error message to user)
  }
};

useEffect(() => {
  fetchDataFromFirestore(userId);
}, []);

const filteredUsers = users.filter((user:any) => {
  const lowerSearchText = searchText.toLowerCase();
  return (
    user.name.toLowerCase().includes(lowerSearchText) ||
    user.id.toString().includes(lowerSearchText)
  );
});



  return (<>
  <div className='w-full  h-[15vh] justify-center items-center flex '> 
  {/* {initialData} */}
  <video id="backgroundVideo" autoPlay muted loop className='h-screen w-[100vw] absolute top-0 left-0 object-cover' style={{zIndex: -1}}>
  <source src="/75318-555531864_large.mp4" type="video/mp4"/>
  Your browser does not support the video tag.
</video>

  <Search filterData={filterData} initialData={initialData} setUsers={setUsers} setSearchText={setSearchText} searchText={searchText}></Search>
  
 
  

  </div>
    <div className='flex flex-col w-full items-center overflow-y-auto h-[85vh]'>
      {filteredUsers.map((user:any) => (
        <PollsCard key={user.id} user={user} flag={flag} setFlag={setFlag} setUsers={setUsers} users={users} />
      ))}
      {filteredUsers.length === 0 && (
        <div className="text-lg text-white mt-[100px]">No users found</div>
      )}

      {loading && (
        
        <>
          <Loader2 className="h-8 w-8 mb-3 animate-spin" />
          <p>Loading...</p>
        </>
        )}
      
      
      
    </div>
    </>)
}

export default Page
