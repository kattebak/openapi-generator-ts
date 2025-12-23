
# Pet


## Properties

Name | Type
------------ | -------------
`id` | number
`name` | string
`tag` | string

## Example

```typescript
import type { Pet } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "tag": null,
} satisfies Pet

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Pet
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


