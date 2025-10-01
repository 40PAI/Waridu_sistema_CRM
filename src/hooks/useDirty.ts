/**
 * Hook for tracking dirty state in forms
 * Compares current form values with initial values using deep equality
 */

import { useState, useEffect } from 'react';

/**
 * Deep equality check for objects
 * Handles arrays, objects, and primitive values
 */
export function isDeepEqual(a: any, b: any): boolean {
  // Same reference
  if (a === b) return true;
  
  // Different types or null/undefined
  if (typeof a !== typeof b || a == null || b == null) return false;
  
  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isDeepEqual(item, b[index]));
  }
  
  // Objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && isDeepEqual(a[key], b[key])
    );
  }
  
  // Primitives
  return a === b;
}

/**
 * Hook for tracking dirty state
 * @param initialValues Initial form values
 * @param currentValues Current form values
 * @returns boolean indicating if form is dirty (has changes)
 */
export function useDirty<T>(initialValues: T, currentValues: T): boolean {
  const [isDirty, setIsDirty] = useState(false);
  
  useEffect(() => {
    const dirty = !isDeepEqual(initialValues, currentValues);
    setIsDirty(dirty);
  }, [initialValues, currentValues]);
  
  return isDirty;
}

/**
 * Hook for managing form state with dirty tracking
 * @param initialValues Initial form values
 * @returns Object with form state, setters, and dirty status
 */
export function useFormDirty<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [initial, setInitial] = useState<T>(initialValues);
  const isDirty = useDirty(initial, values);
  
  const resetToInitial = () => {
    setValues(initial);
  };
  
  const updateInitial = (newInitial: T) => {
    setInitial(newInitial);
    setValues(newInitial);
  };
  
  const markClean = () => {
    setInitial(values);
  };
  
  return {
    values,
    setValues,
    initial,
    isDirty,
    resetToInitial,
    updateInitial,
    markClean
  };
}