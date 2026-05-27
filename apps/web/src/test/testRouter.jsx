import { MemoryRouter } from 'react-router-dom'

export const TEST_ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

export function TestMemoryRouter(props) {
  return <MemoryRouter future={TEST_ROUTER_FUTURE_FLAGS} {...props} />
}
