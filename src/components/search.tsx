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
    <div className="flex w-[80vw] items-center justify-center">
      <Input
        className="w-[70%]"
        type="text"
        placeholder="Search here ..."
        value={searchText}
        onChange={handleInputChange}
      />
      
    </div>
  );
}

