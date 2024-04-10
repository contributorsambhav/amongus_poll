'use client'
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Search({ filterData,initialData,setUsers,setSearchText,searchText}: any) {
  // const [searchText, setSearchText] = useState('');
  const [remove,setRemove] = useState(false);

  const handleSearch = () => {
    // filterData(searchText); // Call filterData function with the current searchText
    setSearchText(''); // Clear the input field after search
  };


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value); // Update searchText state with input value
  };

  return (
    <div className="flex w-[80vw] space-x-2">
      <Input
        className="w-[70%]"
        type="text"
        placeholder="Search here ..."
        value={searchText}
        onChange={handleInputChange}
      />
      {!remove && <Button onClick={(e)=>{
        e.preventDefault();
        if(searchText.length>0){
          handleSearch();
          setRemove(true);
        }
      }}>Search</Button>}
      {remove && <Button onClick={()=>{

    
        console.log("initialData",initialData);
        setUsers(initialData);
        setRemove(false);
      }}>Remove</Button>}
    </div>
  );
}

