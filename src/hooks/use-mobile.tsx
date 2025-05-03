"use client";

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize state to false to match server rendering assumption until client check runs
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window === 'undefined') {
        // This should ideally not happen in useEffect, but good safety check
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches); // Use mql.matches directly
    }

    // Initial check on client mount
    onChange(); // Call once to set the correct state based on initial client width

    // Add listener
    mql.addEventListener("change", onChange)

    // Cleanup listener on component unmount
    return () => mql.removeEventListener("change", onChange)
  }, []) // Empty dependency array ensures this runs once on mount (client-side)

  return isMobile // Return the state
}
