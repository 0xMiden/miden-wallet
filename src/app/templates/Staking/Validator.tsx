import React, { FC } from 'react';

const Validator: FC = () => {
  return (
    <div className="w-full border border-gray-600 p-4 rounded-lg mt-2">
      <div className="flex flex-row items-center">
        <div className="py-1 flex flex-col justify-center h-6 w-6 bg-blue-500 rounded-full mr-1"></div>
        <span className="text-sm text-black font-medium">Aleo Validator</span>
      </div>
    </div>
  );
};

export default Validator;
