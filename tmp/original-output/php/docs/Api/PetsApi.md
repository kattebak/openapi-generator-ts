# OpenAPI\Client\PetsApi



All URIs are relative to http://petstore.swagger.io/v1, except if the operation defines another base path.

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**createPets()**](PetsApi.md#createPets) | **POST** /pets | Create a pet |
| [**listPets()**](PetsApi.md#listPets) | **GET** /pets | List all pets |
| [**showPetById()**](PetsApi.md#showPetById) | **GET** /pets/{petId} | Info for a specific pet |


## `createPets()`

```php
createPets($pet)
```

Create a pet

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new OpenAPI\Client\Api\PetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);
$pet = new \OpenAPI\Client\Model\Pet(); // \OpenAPI\Client\Model\Pet

try {
    $apiInstance->createPets($pet);
} catch (Exception $e) {
    echo 'Exception when calling PetsApi->createPets: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **pet** | [**\OpenAPI\Client\Model\Pet**](../Model/Pet.md)|  | |

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `listPets()`

```php
listPets($limit): \OpenAPI\Client\Model\Pet[]
```

List all pets

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new OpenAPI\Client\Api\PetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);
$limit = 56; // int | How many items to return at one time (max 100)

try {
    $result = $apiInstance->listPets($limit);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling PetsApi->listPets: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **limit** | **int**| How many items to return at one time (max 100) | [optional] |

### Return type

[**\OpenAPI\Client\Model\Pet[]**](../Model/Pet.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)

## `showPetById()`

```php
showPetById($pet_id): \OpenAPI\Client\Model\Pet
```

Info for a specific pet

### Example

```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');



$apiInstance = new OpenAPI\Client\Api\PetsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client()
);
$pet_id = 'pet_id_example'; // string | The id of the pet to retrieve

try {
    $result = $apiInstance->showPetById($pet_id);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling PetsApi->showPetById: ', $e->getMessage(), PHP_EOL;
}
```

### Parameters

| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **pet_id** | **string**| The id of the pet to retrieve | |

### Return type

[**\OpenAPI\Client\Model\Pet**](../Model/Pet.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

[[Back to top]](#) [[Back to API list]](../../README.md#endpoints)
[[Back to Model list]](../../README.md#models)
[[Back to README]](../../README.md)
