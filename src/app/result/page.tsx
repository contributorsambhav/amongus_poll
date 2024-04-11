'use client'
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc,where,deleteDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import firebase_app from '@/firebaseConfig';
import { set } from 'firebase/database';
import { toast } from 'react-toastify';

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
      console.log("teamsQuerySnapshotplayer",teamsQuerySnapshot)

      // Array to store deletion promises
      const deletionPromises = [];

      // Iterate through each team document
      teamsQuerySnapshot.forEach(async (teamDoc) => {
        console.log("teamDocplayer",teamDoc)
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

  const checkAndUpdateTeam = async (character:string, name:string, teamname:string,Email:string) => {
    try {
      const db = getFirestore(firebase_app);
      console.log(teamname,character,name)
  
      // Query Firestore to get the team document based on TeamName
      const teamsCollectionRef = collection(db, 'Teams');
      const teamsQuerySnapshot = await getDocs(query(teamsCollectionRef, where('TeamName', '==', teamname)));
  
      // Check if team document with the specified TeamName existsTeamName
      console.log("teamsQuerySnapshot",teamsQuerySnapshot)
      if (!teamsQuerySnapshot.empty) {
        const teamDoc = teamsQuerySnapshot.docs[0]; // Assuming there's only one team with this TeamName
  
        const teamId = teamDoc.id;
        const playersCollectionRef = collection(teamDoc.ref, 'players');
  
        // Count the number of players in the team
        const playersQuerySnapshot = await getDocs(playersCollectionRef);
        const numberOfPlayers = playersQuerySnapshot.size;
  
        console.log(`Team ${teamId} has ${numberOfPlayers} players.`);
  
        // Check the player's character and update team state accordingly
        if (character === 'crewmate') {
          // If crewmate and team has 2 or fewer players, set isAlive to false
          // if (numberOfPlayers <= 3) {
          //   await updateTeamStatus(teamId, false);
            
          //   console.log(`Team ${teamId} has been eliminated.`);
          //   if (!toast.isActive('error-toast')) {
          //     toast.error(`Team ${teamname} has been eliminated.`, { toastId: 'error-toast' });

          //   }
            
          // }
          await deletePlayerByEmail(Email);
          console.log(`${name} was a crewmate.`);
        } else if (character === 'imposter') {
         
          // If imposter, set isAlive to false
          await updateTeamStatus(teamId, false);
          await deletePlayerByEmail(Email);
          console.log(`Team ${teamId} has been eliminated.`);
          if (!toast.isActive('error-toast')) {
            toast.error(`Team ${teamname} has been eliminated.`, { toastId: 'error-toast' });

          }
          console.log(`${name} was an imposter.`);
        } else {
          console.log('Error checking and updating team: Invalid character');
          return 'Error checking and updating team: Invalid character';
        }
  
        return `${name} was an ${character}.`; // Return a message indicating the processing
      } else {
        // console.log(`Team with TeamName ${teamname} not found.`);
        toast.error(`Team with TeamName ${teamname} not found.`);
        return `Team with TeamName ${teamname} not found.`;
      }
    } catch (error) {
      console.error('Error checking and updating team:', error);
      return 'Error checking and updating team: ' + error.message;
    }
  };
  

  
  
  const updateTeamStatus = async (teamId: string, isAlive: boolean) => {
    const db = getFirestore(firebase_app);
    const teamDocRef = doc(db, 'Teams', teamId);
    await updateDoc(teamDocRef, { isAlive });
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
        console.log("removedUser",removedUser)
        const userDocRef = doc(db, "AllPlayers", removedUser.Email);
        // Assuming each user document has an 'id' field
        
   
        message = await checkAndUpdateTeam(removedUser.Character,removedUser.Name,removedUser.TeamName,removedUser.Email);
        await updateDoc(userDocRef, { IsAlive: false }); 
        
        

        // message = `${removedUser.Name} has been removed.`;

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
    <div className="flex w-screen h-screen justify-center items-center text-[red]
      flex-col relative">
      {typeof window !== 'undefined' && (
        <video id="backgroundVideo" autoPlay muted loop className="fixed top-0 left-0 object-cover w-full h-full" style={{ zIndex: -1 }}>
          <source src="/75318-555531864_large.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      <h1 className="mb-6 text-2xl">{message}</h1>

        <div className='h-[500px] overflow-y-auto'>
      <h1 className="mb-6 text-2xl">{message}</h1>

{!loading ? (
  data.map((user, index) => (
    <p key={index} className="mb-3">
      #{index + 1} {user.Name} : {user.votes} votes
    </p>
  ))
) : (
  <>
    <Loader2 className="h-8 w-8 mb-3 animate-spin " />
    <p>Loading...</p>
  </>
)}





      </div>
    </div>
  );
};

export default Page;
