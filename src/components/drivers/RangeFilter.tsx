import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RangeFilterProps {
	label: string;
	value: [string | number, string | number];
	onChange: (value: [string | number, string | number]) => void;
	min: number;
	max: number;
	placeholder?: [string, string];
}

export function RangeFilter({ label, value, onChange, min, max, placeholder = ['Min', 'Max'] }: RangeFilterProps) {
	return (
		<div className='space-y-2'>
			<Label className='text-sm font-medium'>{label}</Label>
			<div className='flex gap-2'>
				<Input
					type='number'
					placeholder={placeholder[0]}
					value={value[0]}
					onChange={(e) => {
						const val = e.target.value;
						onChange([val === '' ? '' : val, value[1]]);
					}}
					min={min}
					max={max}
					className='w-full'
				/>
				<Input
					type='number'
					placeholder={placeholder[1]}
					value={value[1]}
					onChange={(e) => {
						const val = e.target.value;
						onChange([value[0], val === '' ? '' : val]);
					}}
					min={min}
					max={max}
					className='w-full'
				/>
			</div>
		</div>
	);
}