'use client'
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
// import "../../firebaseConfig";
import { db } from '../../firebaseConfig'; // Import the db instance from firebaseConfig

const Page = () => {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataFromFirestore = async () => {
      try {
        // const db = getFirestore();
        const usersCollectionRef = collection(db, 'users');

        // Query all documents from the 'users' collection and order by 'votes' in descending order
        const q = query(usersCollectionRef, orderBy('votes', 'desc'));
        const querySnapshot = await getDocs(q);

        // Extract data from querySnapshot into an array of user objects
        const users = querySnapshot.docs.map(doc => doc.data());

        // Check the top two users to determine if they have the same highest votes
        let message = '';
        if (users.length >= 2 && users[0].votes === users[1].votes) {
          message = `No one was removed`;
        } else {
          message = `${users[0].name} has been removed.`;
        }

        // Set the state with the top users
        setData(users);

        // Set the message state
        setMessage(message);

        // Set loading state to false
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        setMessage(`Error fetching data from Firestore: ${error}`);
        setLoading(false);
      }
    };

    fetchDataFromFirestore();
  }, []); // Run once on component mount

  return (
    <div className="flex w-screen h-screen justify-center items-center text-white flex-col relative">
      {typeof window !== 'undefined' && ( // Render video only on the client-side
        <video id="backgroundVideo" autoPlay muted loop className="fixed top-0 left-0 object-cover w-full h-full" style={{ zIndex: -1 }}>
          <source src="/75318-555531864_large.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <h1 className="mb-6 text-2xl">{message}</h1>

      {!loading ? (
        data.map((user, index) => (
          <p key={index} className="mb-3">
            #{index + 1} {user.name} : {user.votes} votes
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
