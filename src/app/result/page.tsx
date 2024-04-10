'use client'
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc,where,deleteDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import firebase_app from '@/firebaseConfig';

const Page = () => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  //delete function

  const deletePlayerByEmail = async (email:string) => {
    try {
      const db = getFirestore(firebase_app);
      const teamsCollectionRef = collection(db, 'Teams');

      const teamsQuerySnapshot = await getDocs(teamsCollectionRef);

      // Array to store deletion promises
      const deletionPromises = [];

      // Iterate through each team document
      teamsQuerySnapshot.forEach(async (teamDoc) => {
        const teamId = teamDoc.id;

        // Reference to the 'players' subcollection of the current team document
        const playersCollectionRef = collection(teamDoc.ref, 'players');

        // Query to find the player document with the specified email
        const q = query(playersCollectionRef, where('email', '==', email));
        const playerQuerySnapshot:any= await getDocs(q);

        // If player document is found, delete it
        playerQuerySnapshot.forEach((playerDoc:any) => {
          const playerDocRef = doc(db, `Teams/${teamId}/players/${playerDoc.id}`);
          deletionPromises.push(deleteDoc(playerDocRef));
        });
      });

      // Execute all deletion promises
      await Promise.all(deletionPromises);
      console.log(`Player with email '${email}' deleted successfully.`);
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const fetchDataFromFirestore = async () => {
    try {
      const db = getFirestore(firebase_app);
      const usersCollectionRef = collection(db, "AllPlayers");

      const q = query(usersCollectionRef, orderBy('votes', 'desc'));
      const querySnapshot = await getDocs(q);

      const users = querySnapshot.docs
  .map(doc => doc.data()) // Extract data from each document
  .filter(user => user.IsAlive === true);
   console.log("users",users)
      if(users.length === 0){
        setMessage('No users found');
        setLoading(false);
        return
      }
      let message = '';
      if ((users.length >= 2 && users[0].votes === users[1].votes) || users[0].votes===0) {
        message = `No one was removed`;
      } else{
        const removedUser = users[0]; // Assuming the user with the highest votes is removed
        

        // Update the IsAlive field of the removed user
        const userDocRef = doc(db, "AllPlayers", removedUser.Email); // Assuming each user document has an 'id' field
        await updateDoc(userDocRef, { IsAlive: false });
        await deletePlayerByEmail(removedUser.Email);
        message = `${removedUser.Name} has been removed.`;
      }

      setData(users);
      setMessage(message);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
      setMessage(`Error fetching data from Firestore: ${error}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataFromFirestore();
  }, []);

  return (
    <div className="flex w-screen h-screen justify-center items-center text-white flex-col relative">
      {typeof window !== 'undefined' && (
        <video id="backgroundVideo" autoPlay muted loop className="fixed top-0 left-0 object-cover w-full h-full" style={{ zIndex: -1 }}>
          <source src="/75318-555531864_large.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <h1 className="mb-6 text-2xl">{message}</h1>

      {!loading ? (
        data.map((user, index) => (
          <p key={index} className="mb-3">
            #{index + 1} {user.Name} : {user.votes} votes
          </p>
        ))
      ) : (
        <>
          <Loader2 className="h-8 w-8 mb-3 animate-spin" />
          <p>Loading...</p>
        </>
      )}
    </div>
  );
};

export default Page;
