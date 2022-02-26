import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Room from './pages/room'
import List from './pages/list'
import Layout from './layout'

const App = () => (
  <BrowserRouter basename='chat'>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<List />} />
        <Route path="room/:id" element={<Room />} />
      </Route>
      <Route path="*" element={
        <div>Page Not Found</div>
      } />
    </Routes>
  </BrowserRouter>
)

export default App
