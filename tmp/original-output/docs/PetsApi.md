# PetsApi

All URIs are relative to *http://petstore.swagger.io/v1*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createPets**](PetsApi.md#createpets) | **POST** /pets | Create a pet |
| [**listPets**](PetsApi.md#listpets) | **GET** /pets | List all pets |
| [**showPetById**](PetsApi.md#showpetbyid) | **GET** /pets/{petId} | Info for a specific pet |



## createPets

> createPets(pet)

Create a pet

### Example

```ts
import {
  Configuration,
  PetsApi,
} from '';
import type { CreatePetsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PetsApi();

  const body = {
    // Pet
    pet: ...,
  } satisfies CreatePetsRequest;

  try {
    const data = await api.createPets(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **pet** | [Pet](Pet.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Null response |  -  |
| **0** | unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listPets

> Array&lt;Pet&gt; listPets(limit)

List all pets

### Example

```ts
import {
  Configuration,
  PetsApi,
} from '';
import type { ListPetsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PetsApi();

  const body = {
    // number | How many items to return at one time (max 100) (optional)
    limit: 56,
  } satisfies ListPetsRequest;

  try {
    const data = await api.listPets(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | `number` | How many items to return at one time (max 100) | [Optional] [Defaults to `undefined`] |

### Return type

[**Array&lt;Pet&gt;**](Pet.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | A paged array of pets |  * x-next - A link to the next page of responses <br>  |
| **0** | unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showPetById

> Pet showPetById(petId)

Info for a specific pet

### Example

```ts
import {
  Configuration,
  PetsApi,
} from '';
import type { ShowPetByIdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PetsApi();

  const body = {
    // string | The id of the pet to retrieve
    petId: petId_example,
  } satisfies ShowPetByIdRequest;

  try {
    const data = await api.showPetById(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **petId** | `string` | The id of the pet to retrieve | [Defaults to `undefined`] |

### Return type

[**Pet**](Pet.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Expected response to a valid request |  -  |
| **0** | unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

