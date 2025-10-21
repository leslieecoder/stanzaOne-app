"use client";

import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function NavBar() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
  await signOut(auth);
  router.push("/login");
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (showDropdown && !(e.target as Element).closest('.dropdown-container')) {
      setShowDropdown(false);
    }
  };

  return (
  <nav className="bg-linear-to-r from-[#10a91d] to-[#7ed957] shadow-sm border-b border-gray-200 py-3" onClick={handleClickOutside}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center">
          <img
          src="/assets/white-logo.svg"
          alt="StanzaOne"
          className="h-25 w-auto"
          />
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
          <div className="relative dropdown-container">
          <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 text-sm text-white hover:text-gray-100"
          >
          {/* User Icon */}
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {/* Display Name */}
          <span className="text-white">{userProfile?.displayName || 'Usuario'}</span>
          {/* Dropdown Arrow */}
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="p-4">
                    <div className="text-sm">
                        <p className="font-medium">{userProfile?.displayName || 'Usuario'}</p>
                        <p className="text-gray-500">{user.email}</p>
                        {userProfile?.role && (
                          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {userProfile.role}
                          </span>
                        )}
                      </div>

                      {userProfile && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                          {userProfile.phone && <p>📞 {userProfile.phone}</p>}
                          {userProfile.occupation && <p>💼 {userProfile.occupation}</p>}
                          {userProfile.emergencyContact && (
                            <p>🚨 {userProfile.emergencyContact}
                              {userProfile.emergencyPhone && ` (${userProfile.emergencyPhone})`}
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="mt-3 w-full bg-(--color-cancel) text-white px-3 py-2 rounded-md hover:bg-(--color-cancel-hover) text-sm"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-(--color-primary) text-white px-4 py-2 rounded-md hover:bg-(--color-primary-hover) text-sm"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
