# IDEAAddressComponent

## Selector

idea-address

## Inputs

- `address` (*Address*) - The address to manage.
- `showContact` (*boolean*) - If true, show the field `contact`.
- `showAddress2` (*boolean*) - If true, show the field `address2`.
- `showPhone` (*boolean*) - If true, show the field `phone`.
- `showEmail` (*boolean*) - If true, show the field `email`.
- `editMode` (*boolean*) - Whether the fields are editable or disabled.
- `obligatory` (*boolean*) - If true, show obligatory dots.
- `lines` (*string*) - The lines attribute of the item.
- `label` (*string*) - The label to show for the field; if not set, it has a default value.
- `placeholder` (*string*) - The placeholder to show for the field.
- `openByDefault` (*boolean*) - To toggle the detailed view.

## Outputs

- `addressChange` (*EventEmitter<Address>*) 
