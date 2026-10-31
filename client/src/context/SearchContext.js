import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SearchContext = createContext({
  searchTerm: "",
  setSearchTerm: () => {},
  clearSearch: () => {},
});

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  // Reset search term when navigating to a different page
  useEffect(() => {
    setSearchTerm("");
  }, [location.pathname]);

  const clearSearch = () => setSearchTerm("");

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        clearSearch,
        pathname: location.pathname,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
