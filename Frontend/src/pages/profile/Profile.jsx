// src/pages/profile/Profile.jsx - Corrigé avec les bons chemins d'import
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { classNames } from "../../utils/helpers";
import ProfileInfo from "./components/ProfileInfo";
import PasswordUpdate from "./PasswordUpdate";
import AccountSecurity from "./components/AccountSecurity";

function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    { name: 'Informations', component: <ProfileInfo /> },
    { name: 'Mot de passe', component: <PasswordUpdate /> },
    { name: 'Sécurité', component: <AccountSecurity /> }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Mon profil
        </h1>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <Tab.List className="flex border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    classNames(
                      'py-4 px-6 text-sm font-medium focus:outline-none',
                      selected
                        ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="p-6">
              {tabs.map((tab, index) => (
                <Tab.Panel key={index}>
                  {tab.component}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;