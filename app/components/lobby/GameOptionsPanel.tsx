import type { GameOptions } from '../../types/game';

interface GameOptionsProps {
    options: GameOptions;
    onOptionsChange: (options: GameOptions) => void;
    isHost: boolean;
    disabled?: boolean;
}

export function GameOptionsPanel({ options, onOptionsChange, isHost, disabled = false }: GameOptionsProps) {
    const handleOptionChange = <K extends keyof GameOptions>(
        key: K,
        value: GameOptions[K]
    ) => {
        if (isHost && !disabled) {
            onOptionsChange({
                ...options,
                [key]: value
            });
        }
    };

    const getTeamSelectionDescription = () => {
        return options.teamSelection === 'random_cards'
            ? 'Draw cards to determine teams (lowest two cards partner up)'
            : 'Teams are set by seating position (current lobby arrangement)';
    };

    const getDealerSelectionDescription = () => {
        return options.dealerSelection === 'random_cards'
            ? 'Players draw cards, lowest card deals'
            : 'Deal cards around until someone gets a black Jack';
    };

    const getRenegingDescription = () => {
        return options.allowReneging
            ? 'Players can play any card (ignores suit-following rules)'
            : 'Must follow suit if possible';
    };

    const getScrewTheDealerDescription = () => {
        return options.screwTheDealer
            ? 'Dealer must call trump if everyone passes in first round'
            : 'Standard rule: dealer can pass and re-deal if no one calls trump';
    };

    const getFarmersHandDescription = () => {
        return options.farmersHand
            ? 'Players can call for re-deal if they have no Aces, Kings, Queens, or Jacks'
            : 'Standard rule: play with any dealt hand';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Game Rules {!isHost && <span className="text-sm font-normal text-gray-500">(Set by Host)</span>}
            </h2>

            {isHost ? (
                // Editable version for host
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Team Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Team Selection</h3>
                        <div className="space-y-2">
                            <label className="flex items-start">
                                <input
                                    type="radio"
                                    name="teamSelection"
                                    value="random_cards"
                                    checked={options.teamSelection === 'random_cards'}
                                    onChange={() => handleOptionChange('teamSelection', 'random_cards')}
                                    disabled={disabled}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    <strong>Random Card Selection</strong><br />
                                    <span className="text-xs">Draw cards to determine teams (lowest two cards partner up)</span>
                                </span>
                            </label>
                            <label className="flex items-start">
                                <input
                                    type="radio"
                                    name="teamSelection"
                                    value="predetermined"
                                    checked={options.teamSelection === 'predetermined'}
                                    onChange={() => handleOptionChange('teamSelection', 'predetermined')}
                                    disabled={disabled}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    <strong>Predetermined Teams</strong><br />
                                    <span className="text-xs">Teams are set by seating position (current lobby arrangement)</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Dealer Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Dealer Selection</h3>
                        <div className="space-y-2">
                            <label className="flex items-start">
                                <input
                                    type="radio"
                                    name="dealerSelection"
                                    value="random_cards"
                                    checked={options.dealerSelection === 'random_cards'}
                                    onChange={() => handleOptionChange('dealerSelection', 'random_cards')}
                                    disabled={disabled}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    <strong>Random Card Selection</strong><br />
                                    <span className="text-xs">Players draw cards, lowest card deals</span>
                                </span>
                            </label>
                            <label className="flex items-start">
                                <input
                                    type="radio"
                                    name="dealerSelection"
                                    value="first_black_jack"
                                    checked={options.dealerSelection === 'first_black_jack'}
                                    onChange={() => handleOptionChange('dealerSelection', 'first_black_jack')}
                                    disabled={disabled}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    <strong>First Black Jack</strong><br />
                                    <span className="text-xs">Deal cards around until someone gets a black Jack</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Reneging */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Card Play Rules</h3>
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                checked={options.allowReneging}
                                onChange={(e) => handleOptionChange('allowReneging', e.target.checked)}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                                <strong>Allow Reneging</strong><br />
                                <span className="text-xs">Players can play any card (ignores suit-following rules)</span>
                            </span>
                        </label>
                        {!options.allowReneging && (
                            <p className="text-xs text-gray-500 mt-2 ml-6">
                                Standard rule: Must follow suit if possible
                            </p>
                        )}
                    </div>

                    {/* Screw the Dealer */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Trump Selection Rules</h3>
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                checked={options.screwTheDealer}
                                onChange={(e) => handleOptionChange('screwTheDealer', e.target.checked)}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                                <strong>Screw the Dealer</strong><br />
                                <span className="text-xs">Dealer must call trump if everyone passes in first round</span>
                            </span>
                        </label>
                        {!options.screwTheDealer && (
                            <p className="text-xs text-gray-500 mt-2 ml-6">
                                Standard rule: dealer can pass and re-deal if no one calls trump
                            </p>
                        )}
                    </div>

                    {/* Farmer's Hand */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Deal Rules</h3>
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                checked={options.farmersHand}
                                onChange={(e) => handleOptionChange('farmersHand', e.target.checked)}
                                disabled={disabled}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                                <strong>Farmer's Hand</strong><br />
                                <span className="text-xs">Players can call for re-deal if they have no Aces, Kings, Queens, or Jacks</span>
                            </span>
                        </label>
                        {!options.farmersHand && (
                            <p className="text-xs text-gray-500 mt-2 ml-6">
                                Standard rule: play with any dealt hand
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                // Readonly version for non-hosts
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {/* Team Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Team Selection</h3>
                        <div className="flex items-center mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-900">
                                {options.teamSelection === 'random_cards' ? 'Random Card Selection' : 'Predetermined Teams'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4">
                            {getTeamSelectionDescription()}
                        </p>
                    </div>

                    {/* Dealer Selection */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Dealer Selection</h3>
                        <div className="flex items-center mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-gray-900">
                                {options.dealerSelection === 'random_cards' ? 'Random Card Selection' : 'First Black Jack'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4">
                            {getDealerSelectionDescription()}
                        </p>
                    </div>

                    {/* Reneging */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Card Play Rules</h3>
                        <div className="flex items-center mb-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${options.allowReneging ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                                {options.allowReneging ? 'Reneging Allowed' : 'Standard Rules'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4">
                            {getRenegingDescription()}
                        </p>
                    </div>

                    {/* Screw the Dealer */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Trump Selection Rules</h3>
                        <div className="flex items-center mb-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${options.screwTheDealer ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                                {options.screwTheDealer ? 'Screw the Dealer' : 'Standard Rules'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4">
                            {getScrewTheDealerDescription()}
                        </p>
                    </div>

                    {/* Farmer's Hand */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Deal Rules</h3>
                        <div className="flex items-center mb-1">
                            <div className={`w-2 h-2 rounded-full mr-2 ${options.farmersHand ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                                {options.farmersHand ? 'Farmer\'s Hand Allowed' : 'Standard Deal'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 ml-4">
                            {getFarmersHandDescription()}
                        </p>
                    </div>
                </div>
            )}

            {disabled && isHost && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        Game options cannot be changed once the game has started.
                    </p>
                </div>
            )}
        </div>
    );
}

export default GameOptionsPanel;
