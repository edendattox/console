import { Box, TextInput, px } from '@mantine/core';
import { type FC, type ChangeEvent, useEffect } from 'react';
import { useLogQueryStyles } from './styles';
import useMountedState from '@/hooks/useMountedState';
import { IconSearch } from '@tabler/icons-react';
import Dropdown from './Dropdown';
import { useHeaderContext } from '@/layouts/MainLayout/Context';
import { LogStreamData } from '@/@types/parseable/api/stream';
import { notifyError } from '@/utils/notification';

const LiveTailFilter: FC = () => {
	const {
		state: { subLiveTailsData },
	} = useHeaderContext();

	const [searchField, setSearchField] = useMountedState<string>('');
	const [searchValue, setSearchValue] = useMountedState<string>('');
	const [schemaData, setSchemaData] = useMountedState<LogStreamData>([]);

	const onSearchValueChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (!searchField) {
			notifyError({
				id: 'field-empty',
				title: 'Column Field Empty',
				message: 'Please select a column to search',
				autoClose: 2000,
			});
		}
		setSearchValue(event.currentTarget.value);
		subLiveTailsData.set((state) => {
			state.liveTailSearchValue = event.currentTarget.value;
			state.liveTailSearchField = searchField;
		});
	};

	const handleDropdownValue = (value: string) => {
		setSearchField(value);
	};

	useEffect(() => {
		const liveTailSchema = subLiveTailsData.subscribe((value) => {
			setSchemaData(value.liveTailSchemaData);
		});

		return () => {
			liveTailSchema();
		};
	}, [subLiveTailsData]);

	const { classes } = useLogQueryStyles();
	const { liveTailFilterContainer, searchInput } = classes;

	return (
		<Box className={liveTailFilterContainer}>
			{schemaData.length > 0 && (
				<>
					<Dropdown data={schemaData.map((item) => item.name)} onChange={handleDropdownValue} />
					<TextInput
						className={searchInput}
						value={searchValue}
						onChange={onSearchValueChange}
						placeholder="Search"
						icon={<IconSearch size={px('1.2rem')} stroke={1.5} />}
					/>
				</>
			)}
		</Box>
	);
};

export default LiveTailFilter;
