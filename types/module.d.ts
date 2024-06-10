declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/ban-types
  const Component: DefineComponent<{}, {}, any>
  export default Component
}
