import React, { useState } from "react";

import AboutYou from "../components/AboutYou";
import CSRMandate from "../components/CSRMandate";
import CSRGoals from "../components/CSRGoals";

export default function CSRProfile() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="min-h-screen bg-gray-100">
      {currentPage === 1 && (
        <AboutYou
          nextPage={() => setCurrentPage(2)}
        />
      )}

      {currentPage === 2 && (
        <CSRMandate
          previousPage={() => setCurrentPage(1)}
          nextPage={() => setCurrentPage(3)}
        />
      )}

      {currentPage === 3 && (
        <CSRGoals
          previousPage={() => setCurrentPage(2)}
        />
      )}
    </div>
  );
}