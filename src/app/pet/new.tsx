import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addPet } from "../../storage/pets";
import { Pet } from "../../types/pet";

type Option = {
  label: string;
  value: string;
};

const speciesOptions: Option[] = [
  { label: "Gato", value: "Gato" },
  { label: "Cachorro", value: "Cachorro" },
  { label: "Outro", value: "Outro" },
];

const breedOptions: Option[] = [
  { label: "SRD — Sem raça definida", value: "SRD" },
  { label: "Persa", value: "Persa" },
  { label: "Siamês", value: "Siamês" },
  { label: "Maine Coon", value: "Maine Coon" },
  { label: "Ragdoll", value: "Ragdoll" },
  { label: "Bengal", value: "Bengal" },
  {
    label: "British Shorthair",
    value: "British Shorthair",
  },
  { label: "Sphynx", value: "Sphynx" },
  { label: "Angorá", value: "Angorá" },
  {
    label: "Scottish Fold",
    value: "Scottish Fold",
  },
  {
    label: "Outra / Não sei",
    value: "Outra / Não sei",
  },
];

const sexOptions: Option[] = [
  { label: "Macho", value: "Macho" },
  { label: "Fêmea", value: "Fêmea" },
];

const colorOptions: Option[] = [
  { label: "Branco", value: "Branco" },
  { label: "Preto", value: "Preto" },
  { label: "Cinza", value: "Cinza" },
  { label: "Laranja", value: "Laranja" },
  { label: "Creme", value: "Creme" },
  { label: "Marrom", value: "Marrom" },
  { label: "Tigrado", value: "Tigrado" },
  { label: "Tricolor", value: "Tricolor" },
  { label: "Bicolor", value: "Bicolor" },
  {
    label: "Coloração mista",
    value: "Coloração mista",
  },
  {
    label: "Outra",
    value: "Outra",
  },
];

const foodTypeOptions: Option[] = [
  {
    label: "Ração para adultos",
    value: "Ração para adultos",
  },
  {
    label: "Ração para filhotes",
    value: "Ração para filhotes",
  },
  {
    label: "Ração para idosos",
    value: "Ração para idosos",
  },
  {
    label: "Ração para castrados",
    value: "Ração para castrados",
  },
  {
    label: "Ração para controle de peso",
    value: "Ração para controle de peso",
  },
  {
    label: "Ração gastrointestinal",
    value: "Ração gastrointestinal",
  },
  {
    label: "Ração hipoalergênica",
    value: "Ração hipoalergênica",
  },
  {
    label: "Ração renal",
    value: "Ração renal",
  },
  {
    label: "Ração urinária",
    value: "Ração urinária",
  },
  {
    label: "Ração para diabéticos",
    value: "Ração para diabéticos",
  },
  {
    label: "Ração para doenças hepáticas",
    value: "Ração para doenças hepáticas",
  },
  {
    label: "Ração para doenças cardíacas",
    value: "Ração para doenças cardíacas",
  },
  {
    label: "Ração para pele e pelagem",
    value: "Ração para pele e pelagem",
  },
  {
    label: "Ração para bolas de pelo",
    value: "Ração para bolas de pelo",
  },
  {
    label: "Ração natural",
    value: "Ração natural",
  },
  {
    label: "Outra",
    value: "Outra",
  },
];

const mealsOptions: Option[] = [
  { label: "1 refeição", value: "1" },
  { label: "2 refeições", value: "2" },
  { label: "3 refeições", value: "3" },
  { label: "4 refeições", value: "4" },
  { label: "5 refeições", value: "5" },
  { label: "6 refeições", value: "6" },
];

export default function NewPetScreen() {
  const [name, setName] = useState("");

  const [species, setSpecies] = useState("Gato");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("");
  const [color, setColor] = useState("");

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

  const [foodType, setFoodType] = useState("");
  const [dailyAmount, setDailyAmount] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");

  const [biometricRegistered, setBiometricRegistered] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [modalTitle, setModalTitle] =
    useState("");

  const [modalOptions, setModalOptions] =
    useState<Option[]>([]);

  const [modalValue, setModalValue] =
    useState("");

  const [modalSetter, setModalSetter] =
    useState<
      ((value: string) => void) | null
    >(null);

  function openSelector(
    title: string,
    options: Option[],
    currentValue: string,
    setter: (value: string) => void
  ) {
    setModalTitle(title);
    setModalOptions(options);
    setModalValue(currentValue);
    setModalSetter(() => setter);
    setModalVisible(true);
  }

  function handleSelect(value: string) {
    if (modalSetter) {
      modalSetter(value);
    }

    setModalVisible(false);
  }

  function handleBiometricRegistration() {
    Alert.alert(
      "Biometria facial",
      "A integração com o ESP32-CAM será realizada posteriormente. Por enquanto, vamos apenas registrar este pet como preparado para a biometria.",
      [
        {
          text: "Entendi",
          onPress: () =>
            setBiometricRegistered(true),
        },
      ]
    );
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Campo obrigatório",
        "Digite o nome do pet."
      );
      return;
    }

    if (!species) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione a espécie."
      );
      return;
    }

    if (!breed) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione a raça."
      );
      return;
    }

    if (!sex) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione o sexo."
      );
      return;
    }

    if (!color) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione a cor ou pelagem."
      );
      return;
    }

    if (!age.trim()) {
      Alert.alert(
        "Campo obrigatório",
        "Informe a idade do animal."
      );
      return;
    }

    if (!weight.trim()) {
      Alert.alert(
        "Campo obrigatório",
        "Informe o peso do animal."
      );
      return;
    }

    if (!foodType) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione o tipo de alimentação."
      );
      return;
    }

    if (!dailyAmount.trim()) {
      Alert.alert(
        "Campo obrigatório",
        "Informe a quantidade diária de ração."
      );
      return;
    }

    if (!mealsPerDay) {
      Alert.alert(
        "Campo obrigatório",
        "Selecione a quantidade de refeições por dia."
      );
      return;
    }

    const parsedAge = Number(age);

    const parsedWeight = Number(
      weight.replace(",", ".")
    );

    const parsedDailyAmount = Number(
      dailyAmount.replace(",", ".")
    );

    if (
      Number.isNaN(parsedAge) ||
      parsedAge < 0
    ) {
      Alert.alert(
        "Idade inválida",
        "Informe uma idade válida."
      );
      return;
    }

    if (
      Number.isNaN(parsedWeight) ||
      parsedWeight <= 0
    ) {
      Alert.alert(
        "Peso inválido",
        "Informe um peso válido."
      );
      return;
    }

    if (
      Number.isNaN(parsedDailyAmount) ||
      parsedDailyAmount <= 0
    ) {
      Alert.alert(
        "Quantidade inválida",
        "Informe uma quantidade diária válida."
      );
      return;
    }

    setSaving(true);

    try {
      const newPet: Pet = {
        id: Date.now().toString(),

        name: name.trim(),
        species,
        breed,
        sex,
        color,

        age: parsedAge,
        weight: parsedWeight,

        food: {
          type: foodType,
          dailyAmount: parsedDailyAmount,
          mealsPerDay: Number(mealsPerDay),
        },

        feederOnline: false,
        watererOnline: false,
      };

      await addPet(newPet);

      Alert.alert(
        "Pet cadastrado! 🐾",
        `${newPet.name} foi cadastrado com sucesso.`,
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace("/");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Erro ao cadastrar pet:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível cadastrar o pet. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho */}

          <View style={styles.header}>
            <Pressable
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              Novo pet
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Foto */}

          <View style={styles.photoSection}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>
                🐱
              </Text>

              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>
                  📷
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Foto",
                  "A seleção da foto será implementada posteriormente."
                )
              }
            >
              <Text style={styles.photoAction}>
                Adicionar foto
              </Text>
            </Pressable>
          </View>

          {/* Informações básicas */}

          <Text style={styles.sectionTitle}>
            Informações básicas
          </Text>

          <View style={styles.card}>
            <Input
              label="Nome"
              placeholder="Ex.: Luna"
              value={name}
              onChangeText={setName}
            />

            <Select
              label="Espécie"
              value={species}
              placeholder="Selecione a espécie"
              options={speciesOptions}
              onPress={() =>
                openSelector(
                  "Selecionar espécie",
                  speciesOptions,
                  species,
                  setSpecies
                )
              }
            />

            <Select
              label="Raça"
              value={breed}
              placeholder="Selecione a raça"
              options={breedOptions}
              onPress={() =>
                openSelector(
                  "Selecionar raça",
                  breedOptions,
                  breed,
                  setBreed
                )
              }
            />

            <Select
              label="Sexo"
              value={sex}
              placeholder="Selecione o sexo"
              options={sexOptions}
              onPress={() =>
                openSelector(
                  "Selecionar sexo",
                  sexOptions,
                  sex,
                  setSex
                )
              }
            />

            <Select
              label="Cor / pelagem"
              value={color}
              placeholder="Selecione a cor ou pelagem"
              options={colorOptions}
              onPress={() =>
                openSelector(
                  "Selecionar cor / pelagem",
                  colorOptions,
                  color,
                  setColor
                )
              }
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Idade"
                  placeholder="Anos"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInput}>
                <Input
                  label="Peso"
                  placeholder="kg"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Alimentação */}

          <Text style={styles.sectionTitle}>
            Alimentação
          </Text>

          <View style={styles.card}>
            <Select
              label="Tipo de alimentação"
              value={foodType}
              placeholder="Selecione o tipo"
              options={foodTypeOptions}
              onPress={() =>
                openSelector(
                  "Tipo de alimentação",
                  foodTypeOptions,
                  foodType,
                  setFoodType
                )
              }
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Quantidade diária"
                  placeholder="gramas"
                  value={dailyAmount}
                  onChangeText={setDailyAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.halfInput}>
                <Select
                  label="Refeições por dia"
                  value={
                    mealsPerDay
                      ? `${mealsPerDay} refeições`
                      : ""
                  }
                  placeholder="Selecione"
                  options={mealsOptions}
                  onPress={() =>
                    openSelector(
                      "Refeições por dia",
                      mealsOptions,
                      mealsPerDay,
                      setMealsPerDay
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/* Biometria */}

          <Text style={styles.sectionTitle}>
            Identificação do animal
          </Text>

          <View style={styles.biometricCard}>
            <View style={styles.biometricIconContainer}>
              <Text style={styles.biometricIcon}>
                📷
              </Text>
            </View>

            <View style={styles.biometricInfo}>
              <Text style={styles.biometricTitle}>
                Biometria facial
              </Text>

              <Text
                style={styles.biometricDescription}
              >
                Cadastre o rosto do animal para que o
                sistema possa identificá-lo
                automaticamente.
              </Text>

              <View style={styles.biometricStatus}>
                <View
                  style={[
                    styles.statusDot,
                    biometricRegistered
                      ? styles.statusRegistered
                      : styles.statusPending,
                  ]}
                />

                <Text style={styles.statusText}>
                  {biometricRegistered
                    ? "Biometria cadastrada"
                    : "Ainda não cadastrada"}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.biometricButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBiometricRegistration}
          >
            <Text
              style={styles.biometricButtonText}
            >
              {biometricRegistered
                ? "Biometria cadastrada"
                : "Cadastrar biometria facial"}
            </Text>
          </Pressable>

          {/* Salvar */}

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
              saving &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? "Salvando..."
                : "Salvar pet"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>
              Cancelar
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal dos seletores */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setModalVisible(false)
          }
        >
          <Pressable
            style={styles.modalContainer}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {modalTitle}
            </Text>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {modalOptions.map((option) => {
                const selected =
                  option.value === modalValue;

                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.option,
                      selected &&
                        styles.optionSelected,
                      pressed &&
                        styles.optionPressed,
                    ]}
                    onPress={() =>
                      handleSelect(
                        option.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {selected && (
                      <Text
                        style={styles.check}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.modalCancel}
              onPress={() =>
                setModalVisible(false)
              }
            >
              <Text
                style={styles.modalCancelText}
              >
                Cancelar
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?:
    | "default"
    | "numeric"
    | "decimal-pad";
};

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: InputProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A5A5A5"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
      />
    </View>
  );
}

type SelectProps = {
  label: string;
  value: string;
  placeholder: string;
  options: Option[];
  onPress: () => void;
};

function Select({
  label,
  value,
  placeholder,
  onPress,
}: SelectProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.select,
          pressed && styles.selectPressed,
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.selectText,
            !value && styles.selectPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Text style={styles.selectArrow}>
          ▾
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },

  keyboard: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  headerSpacer: {
    width: 42,
  },

  backIcon: {
    fontSize: 32,
    color: "#333",
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  photoSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  photoPlaceholder: {
    width: 125,
    height: 125,
    borderRadius: 42,
    backgroundColor: "#E8E1D5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 12,
  },

  photoEmoji: {
    fontSize: 68,
  },

  cameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  cameraIcon: {
    fontSize: 17,
  },

  photoAction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 28,
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F6F5F2",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#222",
    borderWidth: 1,
    borderColor: "#ECEAE5",
  },

  select: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#F6F5F2",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ECEAE5",
  },

  selectPressed: {
    opacity: 0.7,
  },

  selectText: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    marginRight: 10,
  },

  selectPlaceholder: {
    color: "#A5A5A5",
  },

  selectArrow: {
    fontSize: 18,
    color: "#777",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  halfInput: {
    flex: 1,
  },

  biometricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    marginBottom: 12,
  },

  biometricIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F1EEE8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  biometricIcon: {
    fontSize: 25,
  },

  biometricInfo: {
    flex: 1,
  },

  biometricTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 5,
  },

  biometricDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#777",
  },

  biometricStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  statusRegistered: {
    backgroundColor: "#55A66A",
  },

  statusPending: {
    backgroundColor: "#C9974A",
  },

  statusText: {
    fontSize: 11,
    color: "#777",
  },

  biometricButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#EAE7E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  biometricButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  saveButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#777",
  },

  buttonPressed: {
    opacity: 0.75,
  },

  /* Modal */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: "75%",
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5D5D5",
    alignSelf: "center",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 16,
  },

  optionsList: {
    marginBottom: 12,
  },

  option: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  optionSelected: {
    backgroundColor: "#F1EEE8",
  },

  optionPressed: {
    opacity: 0.6,
  },

  optionText: {
    fontSize: 15,
    color: "#444",
    flex: 1,
  },

  optionTextSelected: {
    fontWeight: "700",
    color: "#222",
  },

  check: {
    fontSize: 20,
    fontWeight: "700",
    color: "#55A66A",
    marginLeft: 10,
  },

  modalCancel: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCancelText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});