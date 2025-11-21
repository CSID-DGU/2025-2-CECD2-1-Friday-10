// src/App.tsx
// import { useEffect, useState } from 'react';
// import SkeletonViewer from './components/SkeletonViewer';
// import { CsvAdapter } from './core/adapter/CsvAdapter';
// import { DataProvider } from './core/DataProvider';


// function App() {
//   const [provider, setProvider] = useState<DataProvider | null>(null);

//   useEffect(() => {
//     const adapter = new CsvAdapter('test_data/holistic_named_xyz_output_labelled.csv');
//     const dp = new DataProvider(adapter);
//     dp.init().then(() => setProvider(dp));
//   }, []);

//   return (
//     <div>
//       <h1>Skeleton Viewer</h1>
//       {provider ? <SkeletonViewer provider={provider} width={800} height={600} /> : <p>Loading...</p>}
//     </div>
//   );
// }

// export default App;

import CaptureController from './components/CaptureController';

function App() {
  return (
    <div>
      <h1>Live 3D 태권학습</h1>
      <CaptureController />
    </div>
  );
}

export default App;