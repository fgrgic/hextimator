import './App.css';
import { useHextimator } from 'hextimator/react';

function App() {
	useHextimator('#3a86ff');

	return (
		<div className="bg-accent-weak">
			<h1 className="text-accent-foreground">Hello, world!</h1>
		</div>
	);
}

export default App;
